import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

import {
  fetchState,
  pushFavorite,
  pushProgress,
  type TokenGetter,
} from "@/lib/api";
import { isClerkConfigured } from "@/lib/auth/config";

export type ProgressStatus = "unstarted" | "learning" | "learned";

/** Reading theme. "paper" = off-white light; "night" = off-black reverse. */
export type ThemeName = "paper" | "night";

interface SlokaProgress {
  status: ProgressStatus;
  savedAt?: string;
  inMySlokas: boolean;
}

export type SyncState = "idle" | "syncing" | "synced" | "error" | "pending";

interface AuthState {
  loggedIn: boolean;
  email: string | null;
}

/** What the ClerkSyncBridge feeds in from inside ClerkProvider. */
interface ClerkAuth {
  isSignedIn: boolean;
  getToken: TokenGetter;
  email: string | null;
}

interface AppContextType {
  progress: Record<string, SlokaProgress>;
  setProgress: (id: string, status: ProgressStatus) => void;
  toggleMySlokas: (id: string) => void;
  isMySlokas: (id: string) => boolean;
  getStatus: (id: string) => ProgressStatus;
  syncState: SyncState;
  lastSynced: Date | null;
  auth: AuthState;
  /** Called by ClerkSyncBridge to mirror the Clerk session into the context. */
  syncAuth: (a: ClerkAuth) => void;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "sloka_hub_progress";
const THEME_KEY = "sloka_hub_theme";
const DEFAULT_THEME: ThemeName = "paper";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<Record<string, SlokaProgress>>(
    {},
  );
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false, email: null });
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  // Boot: hydrate saved theme preference (separate from progress hydration).
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((value) => {
        if (value === "paper" || value === "night") setThemeState(value);
      })
      .catch(() => {});
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    AsyncStorage.setItem(THEME_KEY, t).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next: ThemeName = current === "paper" ? "night" : "paper";
      AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  // Ref mirrors of the Clerk session so mutation callbacks always read the
  // latest value without being re-created. getToken is null until the bridge
  // reports a signed-in session; signedIn gates the "sign-in to save" flow.
  const signedInRef = useRef(false);
  const getTokenRef = useRef<TokenGetter | null>(null);

  const persist = useCallback((next: Record<string, SlokaProgress>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // Boot: hydrate local storage. Cloud reconciliation happens later, when the
  // ClerkSyncBridge reports a signed-in session (see syncAuth).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProgressState(JSON.parse(raw));
      } catch {
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      }
    })();
  }, []);

  // Pull the signed-in user's cloud state and merge it over local (cloud is
  // authoritative; local-only entries are kept on-device but not migrated up —
  // this is the agreed clean switch). Web only for now.
  const reconcileFromCloud = useCallback(async () => {
    if (Platform.OS !== "web") return;
    const getToken = getTokenRef.current;
    if (!getToken) return;

    setSyncState("syncing");
    const cloud = await fetchState(getToken);
    if (!cloud) {
      setSyncState("error");
      return;
    }
    setProgressState((local) => {
      const merged: Record<string, SlokaProgress> = { ...local };
      for (const [id, s] of Object.entries(cloud)) {
        merged[id] = {
          status: s.status,
          inMySlokas: s.inMySlokas,
          savedAt: s.savedAt ?? undefined,
        };
      }
      persist(merged);
      return merged;
    });
    setSyncState("synced");
    setLastSynced(new Date());
  }, [persist]);

  // Receive the Clerk session from the bridge. Kick a cloud reconcile when the
  // session transitions from signed-out to signed-in.
  const syncAuth = useCallback(
    ({ isSignedIn, getToken, email }: ClerkAuth) => {
      getTokenRef.current = getToken;
      const wasSignedIn = signedInRef.current;
      signedInRef.current = isSignedIn;
      // Keep the same object when nothing changed so an unstable getToken/user
      // identity from Clerk can't trigger a re-render loop.
      setAuth((prev) =>
        prev.loggedIn === isSignedIn && prev.email === email
          ? prev
          : { loggedIn: isSignedIn, email },
      );
      if (isSignedIn && !wasSignedIn) {
        reconcileFromCloud();
      }
    },
    [reconcileFromCloud],
  );

  // Mark a write-through result on the sync indicator.
  const markSync = useCallback((ok: boolean) => {
    if (!signedInRef.current) return;
    if (ok) {
      setSyncState("synced");
      setLastSynced(new Date());
    } else {
      setSyncState("error");
    }
  }, []);

  // "Browse open, sign in to save": the two write actions require a Clerk
  // session on web. When signed out, send the user to the sign-in screen instead
  // of saving — so all synced progress is tied to an account. When Clerk isn't
  // configured (local-only build) or on native, saving stays local and allowed.
  const ensureAuth = useCallback((): boolean => {
    if (Platform.OS !== "web") return true;
    if (!isClerkConfigured) return true;
    if (signedInRef.current) return true;
    router.push("/(auth)/sign-in");
    return false;
  }, []);

  const setProgress = useCallback(
    (id: string, status: ProgressStatus) => {
      if (!ensureAuth()) return;
      setProgressState((current) => {
        const next = {
          ...current,
          [id]: { ...(current[id] ?? { inMySlokas: false }), status },
        };
        persist(next);
        return next;
      });
      const getToken = getTokenRef.current;
      if (getToken) pushProgress(getToken, id, status).then(markSync);
    },
    [persist, markSync, ensureAuth],
  );

  const toggleMySlokas = useCallback(
    (id: string) => {
      if (!ensureAuth()) return;
      let nextInMySlokas = false;
      setProgressState((current) => {
        const entry =
          current[id] ?? { status: "unstarted" as ProgressStatus, inMySlokas: false };
        nextInMySlokas = !entry.inMySlokas;
        const next = {
          ...current,
          [id]: {
            ...entry,
            inMySlokas: nextInMySlokas,
            savedAt: nextInMySlokas ? new Date().toISOString() : undefined,
          },
        };
        persist(next);
        return next;
      });
      const getToken = getTokenRef.current;
      if (getToken) pushFavorite(getToken, id, nextInMySlokas).then(markSync);
    },
    [persist, markSync, ensureAuth],
  );

  const isMySlokas = useCallback(
    (id: string) => progress[id]?.inMySlokas ?? false,
    [progress],
  );

  const getStatus = useCallback(
    (id: string): ProgressStatus => progress[id]?.status ?? "unstarted",
    [progress],
  );

  return (
    <AppContext.Provider
      value={{
        progress,
        setProgress,
        toggleMySlokas,
        isMySlokas,
        getStatus,
        syncState,
        lastSynced,
        auth,
        syncAuth,
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/**
 * Theme preference, safe to call outside the provider (falls back to the
 * default paper theme) so low-level hooks like useColors never crash.
 */
export function useThemePreference(): {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
} {
  const ctx = useContext(AppContext);
  return {
    theme: ctx?.theme ?? DEFAULT_THEME,
    setTheme: ctx?.setTheme ?? (() => {}),
    toggleTheme: ctx?.toggleTheme ?? (() => {}),
  };
}
