import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

export type ProgressStatus = "unstarted" | "learning" | "learned";

interface SlokaProgress {
  status: ProgressStatus;
  savedAt?: string;
  inMySlokas: boolean;
}

export type SyncState = "idle" | "syncing" | "synced" | "error";

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

function buildApiBase(): string | null {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api`;
    }
    return "/api";
  }
  const domain = process.env.EXPO_PUBLIC_API_URL;
  return domain ?? null;
}

function useApiCall() {
  const { isSignedIn, getToken } = useAuth();

  return useCallback(
    async (method: string, path: string, body?: object) => {
      if (!isSignedIn) return null;
      try {
        const base = buildApiBase();
        if (!base) return null;
        const token = await getToken();
        const res = await fetch(`${base}${path}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) return null;
        if (res.status === 204) return true;
        return res.json();
      } catch {
        return null;
      }
    },
    [isSignedIn, getToken],
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<Record<string, SlokaProgress>>({});
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const apiCall = useApiCall();
  const synced = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setProgressState(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      synced.current = false;
      setSyncState("idle");
      return;
    }
    if (synced.current) return;
    synced.current = true;

    setSyncState("syncing");

    apiCall("POST", "/auth/sync", {
      email: user?.primaryEmailAddress?.emailAddress ?? "",
      displayName: user?.fullName ?? undefined,
    });

    Promise.all([apiCall("GET", "/progress"), apiCall("GET", "/bookmarks")]).then(
      ([progressRows, bookmarkRows]) => {
        if (!progressRows) {
          setSyncState("error");
          return;
        }
        const merged: Record<string, SlokaProgress> = {};
        for (const row of progressRows as Array<{ slokaId: string; status: string }>) {
          merged[row.slokaId] = { status: row.status as ProgressStatus, inMySlokas: false };
        }
        if (bookmarkRows) {
          for (const row of bookmarkRows as Array<{ slokaId: string; savedAt: string }>) {
            if (merged[row.slokaId]) {
              merged[row.slokaId].inMySlokas = true;
              merged[row.slokaId].savedAt = row.savedAt;
            } else {
              merged[row.slokaId] = { status: "unstarted", inMySlokas: true, savedAt: row.savedAt };
            }
          }
        }
        setProgressState(merged);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        setSyncState("synced");
        setLastSynced(new Date());
      },
    );
  }, [isSignedIn, apiCall]);

  const saveProgress = useCallback((updated: Record<string, SlokaProgress>) => {
    setProgressState(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setProgress = useCallback(
    (id: string, status: ProgressStatus) => {
      const current = progress[id] || { status: "unstarted", inMySlokas: false };
      saveProgress({ ...progress, [id]: { ...current, status } });
      if (isSignedIn) {
        apiCall("PUT", `/progress/${id}`, { status }).then((result) => {
          if (result) setLastSynced(new Date());
        });
      }
    },
    [progress, saveProgress, isSignedIn, apiCall],
  );

  const toggleMySlokas = useCallback(
    (id: string) => {
      const current = progress[id] || { status: "unstarted", inMySlokas: false };
      const adding = !current.inMySlokas;
      saveProgress({
        ...progress,
        [id]: {
          ...current,
          inMySlokas: adding,
          savedAt: adding ? new Date().toISOString() : undefined,
        },
      });
      if (isSignedIn) {
        const call = adding
          ? apiCall("POST", `/bookmarks/${id}`)
          : apiCall("DELETE", `/bookmarks/${id}`);
        call.then((result) => {
          if (result) setLastSynced(new Date());
        });
      }
    },
    [progress, saveProgress, isSignedIn, apiCall],
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
      value={{ progress, setProgress, toggleMySlokas, isMySlokas, getStatus, syncState, lastSynced }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
