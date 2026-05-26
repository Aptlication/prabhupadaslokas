import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ProgressStatus = "unstarted" | "learning" | "learned";

interface SlokaProgress {
  status: ProgressStatus;
  savedAt?: string;
  inMySlokas: boolean;
}

/**
 * Sync state is preserved on the public interface so existing components
 * (e.g. <SyncBadge>) keep compiling. In this local-only PWA build it
 * stays "idle" forever; cloud sync will be restored when a backend is
 * brought back online.
 */
export type SyncState = "idle" | "syncing" | "synced" | "error" | "pending";

interface AppContextType {
  progress: Record<string, SlokaProgress>;
  setProgress: (id: string, status: ProgressStatus) => void;
  toggleMySlokas: (id: string) => void;
  isMySlokas: (id: string) => boolean;
  getStatus: (id: string) => ProgressStatus;
  syncState: SyncState;
  lastSynced: Date | null;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "sloka_hub_progress";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<Record<string, SlokaProgress>>(
    {},
  );

  // Local-only mode — cloud sync is intentionally disabled in this PWA build.
  const syncState: SyncState = "idle";
  const lastSynced: Date | null = null;

  // Boot: hydrate from AsyncStorage (uses localStorage shim on web).
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (!data) return;
        try {
          setProgressState(JSON.parse(data));
        } catch {
          // Corrupt blob — wipe so we don't keep failing.
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback((next: Record<string, SlokaProgress>) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setProgress = useCallback(
    (id: string, status: ProgressStatus) => {
      setProgressState((current) => {
        const next = {
          ...current,
          [id]: {
            ...(current[id] ?? { inMySlokas: false }),
            status,
          },
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
          current[id] ?? {
            status: "unstarted" as ProgressStatus,
            inMySlokas: false,
          };
        const nextInMySlokas = !entry.inMySlokas;
        const next = {
          ...current,
          [id]: {
            ...entry,
            inMySlokas: nextInMySlokas,
            savedAt: nextInMySlokas
              ? new Date().toISOString()
              : undefined,
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
        syncState,
        lastSynced,
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
