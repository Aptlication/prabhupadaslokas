import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ProgressStatus = "unstarted" | "learning" | "learned";

/** Reading theme. "paper" = off-white light; "night" = off-black reverse. */
export type ThemeName = "paper" | "night";

interface SlokaProgress {
  status: ProgressStatus;
  savedAt?: string;
  inMySlokas: boolean;
}

interface AppContextType {
  progress: Record<string, SlokaProgress>;
  setProgress: (id: string, status: ProgressStatus) => void;
  toggleMySlokas: (id: string) => void;
  isMySlokas: (id: string) => boolean;
  getStatus: (id: string) => ProgressStatus;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "sloka_hub_progress";
const THEME_KEY = "sloka_hub_theme";
const DEFAULT_THEME: ThemeName = "paper";

// ─── Provider ─────────────────────────────────────────────────────────────────
//
// Read-only launch: no accounts, no backend. Progress and "My Slokas" live
// entirely on-device (AsyncStorage) on every platform. Accounts + cloud sync are
// deferred to phase 2 (Cloudflare Workers + Clerk + Neon) — see repo STATE.md.

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<Record<string, SlokaProgress>>(
    {},
  );
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

  const persist = useCallback((next: Record<string, SlokaProgress>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // Boot: hydrate on-device progress. No auth, no cloud reconcile.
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

  const setProgress = useCallback(
    (id: string, status: ProgressStatus) => {
      setProgressState((current) => {
        const next = {
          ...current,
          [id]: { ...(current[id] ?? { inMySlokas: false }), status },
        };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const toggleMySlokas = useCallback(
    (id: string) => {
      setProgressState((current) => {
        const entry =
          current[id] ?? { status: "unstarted" as ProgressStatus, inMySlokas: false };
        const nextInMySlokas = !entry.inMySlokas;
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
    },
    [persist],
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
