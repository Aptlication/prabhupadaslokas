import AsyncStorage from "@react-native-async-storage/async-storage";
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
  checkAuth,
  fetchState,
  importState,
  login as apiLogin,
  logout as apiLogout,
  pushFavorite,
  pushProgress,
} from "@/lib/api";

export type ProgressStatus = "unstarted" | "learning" | "learned";

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

interface AppContextType {
  progress: Record<string, SlokaProgress>;
  setProgress: (id: string, status: ProgressStatus) => void;
  toggleMySlokas: (id: string) => void;
  isMySlokas: (id: string) => boolean;
  getStatus: (id: string) => ProgressStatus;
  syncState: SyncState;
  lastSynced: Date | null;
  auth: AuthState;
  login: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "sloka_hub_progress";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<Record<string, SlokaProgress>>(
    {},
  );
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false, email: null });

  // Ref mirror of auth so mutation callbacks always read the latest value
  // without being re-created (and without stale-closure bugs).
  const loggedInRef = useRef(false);
  useEffect(() => {
    loggedInRef.current = auth.loggedIn;
  }, [auth.loggedIn]);

  const persist = useCallback((next: Record<string, SlokaProgress>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // Boot: hydrate local, then (web + logged in) reconcile with the cloud.
  useEffect(() => {
    (async () => {
      let local: Record<string, SlokaProgress> = {};
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) local = JSON.parse(raw);
      } catch {
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      }
      setProgressState(local);

      if (Platform.OS !== "web") return; // native stays local-only for now

      const who = await checkAuth();
      setAuth(who);
      if (!who.loggedIn) return;

      setSyncState("syncing");
      const cloud = await fetchState();
      if (!cloud) {
        setSyncState("error");
        return;
      }

      // Cloud is authoritative for slokas it knows; local-only entries get
      // pushed up so nothing on-device is lost on first login.
      const merged = { ...local, ...(cloud as Record<string, SlokaProgress>) };
      setProgressState(merged);
      persist(merged);

      const localOnly: Record<string, SlokaProgress> = {};
      for (const id of Object.keys(local)) {
        if (!(id in cloud)) localOnly[id] = local[id];
      }
      if (Object.keys(localOnly).length) {
        const server = await importState(localOnly as any);
        if (server) {
          setProgressState(server as Record<string, SlokaProgress>);
          persist(server as Record<string, SlokaProgress>);
        }
      }
      setSyncState("synced");
      setLastSynced(new Date());
    })();
  }, [persist]);

  // Mark a write-through result on the sync indicator.
  const markSync = useCallback((ok: boolean) => {
    if (!loggedInRef.current) return;
    if (ok) {
      setSyncState("synced");
      setLastSynced(new Date());
    } else {
      setSyncState("error");
    }
  }, []);

  // "Browse open, sign in to save": the two write actions require an account on
  // web. When logged out, prompt and send the user through Access login instead
  // of saving — so all saved progress is tied to a login. Native has no Access
  // login, so it keeps the local-only behaviour.
  const ensureAuth = useCallback((): boolean => {
    if (Platform.OS !== "web") return true;
    if (loggedInRef.current) return true;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Sign in to save your progress and sync it across your devices?",
      );
      if (ok) apiLogin();
    }
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
      pushProgress(id, status).then(markSync);
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
      pushFavorite(id, nextInMySlokas).then(markSync);
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
        login: apiLogin,
        logout: apiLogout,
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
