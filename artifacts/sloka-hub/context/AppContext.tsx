import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ProgressStatus = "unstarted" | "learning" | "learned";

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
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "sloka_hub_progress";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<Record<string, SlokaProgress>>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setProgressState(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  const saveProgress = useCallback((updated: Record<string, SlokaProgress>) => {
    setProgressState(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setProgress = useCallback(
    (id: string, status: ProgressStatus) => {
      const current = progress[id] || { status: "unstarted", inMySlokas: false };
      saveProgress({
        ...progress,
        [id]: { ...current, status },
      });
    },
    [progress, saveProgress]
  );

  const toggleMySlokas = useCallback(
    (id: string) => {
      const current = progress[id] || { status: "unstarted", inMySlokas: false };
      saveProgress({
        ...progress,
        [id]: {
          ...current,
          inMySlokas: !current.inMySlokas,
          savedAt: !current.inMySlokas ? new Date().toISOString() : undefined,
        },
      });
    },
    [progress, saveProgress]
  );

  const isMySlokas = useCallback(
    (id: string) => progress[id]?.inMySlokas ?? false,
    [progress]
  );

  const getStatus = useCallback(
    (id: string): ProgressStatus => progress[id]?.status ?? "unstarted",
    [progress]
  );

  return (
    <AppContext.Provider value={{ progress, setProgress, toggleMySlokas, isMySlokas, getStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
