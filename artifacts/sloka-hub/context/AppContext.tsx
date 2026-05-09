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
import { AppState, type AppStateStatus, Platform } from "react-native";

export type ProgressStatus = "unstarted" | "learning" | "learned";

interface SlokaProgress {
  status: ProgressStatus;
  savedAt?: string;
  inMySlokas: boolean;
}

/** "pending" = offline writes are queued, waiting to flush */
export type SyncState = "idle" | "syncing" | "synced" | "error" | "pending";

/** Offline write queue — persisted across sessions */
type PendingOp =
  | { type: "progress"; slokaId: string; status: ProgressStatus }
  | { type: "bookmark_add"; slokaId: string }
  | { type: "bookmark_remove"; slokaId: string };

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
const QUEUE_KEY = "sloka_hub_sync_queue";
const MIN_REFETCH_MS = 60_000;

// ─── URL helpers ─────────────────────────────────────────────────────────────

function buildApiBase(): string | null {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") return `${window.location.origin}/api`;
    return "/api";
  }
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url ?? null;
}

// ─── Persistent queue helpers ─────────────────────────────────────────────────

async function loadQueue(): Promise<PendingOp[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingOp[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: PendingOp[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/** Last write for the same slokaId wins — deduplicates the queue */
function dedupeQueue(queue: PendingOp[]): PendingOp[] {
  const seen = new Map<string, PendingOp>();
  for (const op of queue) seen.set(op.slokaId, op);
  return Array.from(seen.values());
}

// ─── Merge helper ─────────────────────────────────────────────────────────────

/**
 * True merge:
 *  1. Start with local state (preserve local-only entries).
 *  2. API progress overrides local for any sloka it knows about.
 *  3. API bookmark list is authoritative for all slokas the API has touched.
 *  4. Pending ops are applied on top (they haven't been synced yet → they win).
 */
function mergeWithApi(
  local: Record<string, SlokaProgress>,
  pending: PendingOp[],
  progressRows: Array<{ slokaId: string; status: string }>,
  bookmarkRows: Array<{ slokaId: string; savedAt: string }>,
): Record<string, SlokaProgress> {
  const merged: Record<string, SlokaProgress> = {};

  // Step 1: seed from local
  for (const [id, p] of Object.entries(local)) {
    merged[id] = { ...p };
  }

  // Step 2: API progress overrides (API wins for conflicts)
  for (const row of progressRows) {
    merged[row.slokaId] = {
      ...(merged[row.slokaId] ?? { inMySlokas: false }),
      status: row.status as ProgressStatus,
    };
  }

  // Step 3: API bookmark list is authoritative for all slokas the API returned
  // Reset inMySlokas for any sloka whose progress the API knows about
  const apiKnownIds = new Set([
    ...progressRows.map((r) => r.slokaId),
    ...bookmarkRows.map((r) => r.slokaId),
  ]);
  for (const id of apiKnownIds) {
    if (merged[id]) {
      merged[id] = { ...merged[id], inMySlokas: false, savedAt: undefined };
    }
  }
  for (const row of bookmarkRows) {
    merged[row.slokaId] = {
      ...(merged[row.slokaId] ?? { status: "unstarted" }),
      inMySlokas: true,
      savedAt: row.savedAt,
    };
  }

  // Step 4: pending ops win over API (offline writes not yet flushed)
  for (const op of dedupeQueue(pending)) {
    const base = merged[op.slokaId] ?? { status: "unstarted", inMySlokas: false };
    if (op.type === "progress") {
      merged[op.slokaId] = { ...base, status: op.status };
    } else if (op.type === "bookmark_add") {
      merged[op.slokaId] = { ...base, inMySlokas: true, savedAt: base.savedAt ?? new Date().toISOString() };
    } else {
      merged[op.slokaId] = { ...base, inMySlokas: false, savedAt: undefined };
    }
  }

  return merged;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgressState] = useState<Record<string, SlokaProgress>>({});
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const lastFetchAt = useRef<number>(0);
  const isFetching = useRef(false);
  const hasSynced = useRef(false);

  // ── Raw API fetch helper ───────────────────────────────────────────────────

  const apiCall = useCallback(
    async (method: string, path: string, body?: object): Promise<unknown> => {
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

  // ── Queue management ───────────────────────────────────────────────────────

  const enqueue = useCallback(async (op: PendingOp) => {
    const current = await loadQueue();
    const next = dedupeQueue([...current, op]);
    await saveQueue(next);
    setSyncState("pending");
  }, []);

  const flushQueue = useCallback(
    async (currentProgress: Record<string, SlokaProgress>): Promise<Record<string, SlokaProgress>> => {
      const queue = await loadQueue();
      if (queue.length === 0) return currentProgress;

      setSyncState("syncing");
      const remaining: PendingOp[] = [];

      for (const op of dedupeQueue(queue)) {
        let ok = false;
        if (op.type === "progress") {
          ok = !!(await apiCall("PUT", `/progress/${op.slokaId}`, { status: op.status }));
        } else if (op.type === "bookmark_add") {
          ok = !!(await apiCall("POST", `/bookmarks/${op.slokaId}`));
        } else {
          ok = !!(await apiCall("DELETE", `/bookmarks/${op.slokaId}`));
        }
        if (!ok) remaining.push(op);
      }

      await saveQueue(remaining);
      return currentProgress;
    },
    [apiCall],
  );

  // ── Full cloud fetch + merge ───────────────────────────────────────────────

  const fetchAndMerge = useCallback(
    async (local: Record<string, SlokaProgress>) => {
      if (isFetching.current) return;
      isFetching.current = true;
      setSyncState("syncing");

      try {
        // Sync user record first
        await apiCall("POST", "/auth/sync", {
          email: user?.primaryEmailAddress?.emailAddress ?? "",
          displayName: user?.fullName ?? undefined,
        });

        // Flush pending queue before fetching (so server state is current)
        const pending = await loadQueue();
        if (pending.length > 0) {
          const remaining: PendingOp[] = [];
          for (const op of dedupeQueue(pending)) {
            let ok = false;
            if (op.type === "progress") {
              ok = !!(await apiCall("PUT", `/progress/${op.slokaId}`, { status: op.status }));
            } else if (op.type === "bookmark_add") {
              ok = !!(await apiCall("POST", `/bookmarks/${op.slokaId}`));
            } else {
              ok = !!(await apiCall("DELETE", `/bookmarks/${op.slokaId}`));
            }
            if (!ok) remaining.push(op);
          }
          await saveQueue(remaining);
        }

        // Fetch current server state
        const [progressRows, bookmarkRows] = await Promise.all([
          apiCall("GET", "/progress"),
          apiCall("GET", "/bookmarks"),
        ]);

        if (!progressRows) {
          setSyncState("error");
          return;
        }

        // Re-read queue (some ops may have failed to flush above)
        const stillPending = await loadQueue();

        const merged = mergeWithApi(
          local,
          stillPending,
          progressRows as Array<{ slokaId: string; status: string }>,
          bookmarkRows
            ? (bookmarkRows as Array<{ slokaId: string; savedAt: string }>)
            : [],
        );

        setProgressState(merged);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        lastFetchAt.current = Date.now();
        setSyncState(stillPending.length > 0 ? "pending" : "synced");
        setLastSynced(new Date());
      } finally {
        isFetching.current = false;
      }
    },
    [apiCall, user],
  );

  // ── Boot: load local state ─────────────────────────────────────────────────

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setProgressState(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  // ── Sign-in: initial cloud fetch ───────────────────────────────────────────

  useEffect(() => {
    if (!isSignedIn) {
      hasSynced.current = false;
      setSyncState("idle");
      return;
    }
    if (hasSynced.current) return;
    hasSynced.current = true;
    // Use functional form to access latest local state
    setProgressState((current) => {
      fetchAndMerge(current);
      return current;
    });
  }, [isSignedIn, fetchAndMerge]);

  // ── AppState: re-fetch on foreground (min 60 s between fetches) ────────────

  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state !== "active" || !isSignedIn) return;
      if (Date.now() - lastFetchAt.current < MIN_REFETCH_MS) return;
      setProgressState((current) => {
        fetchAndMerge(current);
        return current;
      });
    };

    const sub = AppState.addEventListener("change", handleAppState);
    return () => sub.remove();
  }, [isSignedIn, fetchAndMerge]);

  // ── Local helpers ──────────────────────────────────────────────────────────

  const persistProgress = useCallback((updated: Record<string, SlokaProgress>) => {
    setProgressState(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // ── setProgress (optimistic + background sync) ─────────────────────────────

  const setProgress = useCallback(
    (id: string, status: ProgressStatus) => {
      const current = progress[id] || { status: "unstarted", inMySlokas: false };
      persistProgress({ ...progress, [id]: { ...current, status } });

      if (isSignedIn) {
        apiCall("PUT", `/progress/${id}`, { status }).then((result) => {
          if (result) {
            setLastSynced(new Date());
          } else {
            enqueue({ type: "progress", slokaId: id, status });
          }
        });
      }
    },
    [progress, persistProgress, isSignedIn, apiCall, enqueue],
  );

  // ── toggleMySlokas (optimistic + background sync) ──────────────────────────

  const toggleMySlokas = useCallback(
    (id: string) => {
      const current = progress[id] || { status: "unstarted", inMySlokas: false };
      const adding = !current.inMySlokas;
      persistProgress({
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
          if (result) {
            setLastSynced(new Date());
          } else {
            enqueue(adding ? { type: "bookmark_add", slokaId: id } : { type: "bookmark_remove", slokaId: id });
          }
        });
      }
    },
    [progress, persistProgress, isSignedIn, apiCall, enqueue],
  );

  const isMySlokas = useCallback((id: string) => progress[id]?.inMySlokas ?? false, [progress]);
  const getStatus = useCallback((id: string): ProgressStatus => progress[id]?.status ?? "unstarted", [progress]);

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
