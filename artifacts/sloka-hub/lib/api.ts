// lib/api.ts — thin client for the Clerk-authed Express api-server.
//
// All sync targets ${API_URL} (EXPO_PUBLIC_API_URL) and carries a Clerk-issued
// bearer token. Everything is web-only and fails soft: on native, when signed
// out (no token), when no API_URL is configured, or offline, calls resolve to a
// benign value and the app keeps using local storage.

import { Platform } from "react-native";

import { API_URL } from "@/lib/auth/config";

export type Status = "unstarted" | "learning" | "learned";
export interface SlokaState {
  status: Status;
  inMySlokas: boolean;
  savedAt: string | null;
}
export type StateMap = Record<string, SlokaState>;

/** Supplies a fresh Clerk session token, or null when signed out. */
export type TokenGetter = () => Promise<string | null>;

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

/** Sync is possible only on web with an api-server origin configured. */
function ready(): boolean {
  return isWeb && !!API_URL;
}

async function authHeader(getToken: TokenGetter): Promise<Record<string, string> | null> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

interface ProgressRow {
  slokaId: string;
  status: Status;
  updatedAt?: string | null;
}
interface BookmarkRow {
  slokaId: string;
  createdAt?: string | null;
}

/**
 * Fetch the signed-in user's cloud progress + bookmarks and merge them into a
 * single StateMap. The backend keeps progress (status) and bookmarks
 * (inMySlokas) as separate resources; we recombine them here. Returns null when
 * unavailable (not web, no token, or a failed request).
 */
export async function fetchState(getToken: TokenGetter): Promise<StateMap | null> {
  if (!ready()) return null;
  try {
    const headers = await authHeader(getToken);
    if (!headers) return null;
    const [pRes, bRes] = await Promise.all([
      fetch(`${API_URL}/api/progress`, { headers }),
      fetch(`${API_URL}/api/bookmarks`, { headers }),
    ]);
    if (!pRes.ok || !bRes.ok) return null;
    const progress = (await pRes.json()) as ProgressRow[];
    const bookmarks = (await bRes.json()) as BookmarkRow[];

    const map: StateMap = {};
    for (const r of progress) {
      map[r.slokaId] = {
        status: r.status,
        inMySlokas: false,
        savedAt: r.updatedAt ?? null,
      };
    }
    for (const b of bookmarks) {
      const e = map[b.slokaId] ?? {
        status: "unstarted" as Status,
        inMySlokas: false,
        savedAt: null,
      };
      map[b.slokaId] = { ...e, inMySlokas: true, savedAt: b.createdAt ?? e.savedAt };
    }
    return map;
  } catch {
    return null;
  }
}

/** Upsert a sloka's learning status. */
export async function pushProgress(
  getToken: TokenGetter,
  slokaId: string,
  status: Status,
): Promise<boolean> {
  if (!ready()) return false;
  try {
    const headers = await authHeader(getToken);
    if (!headers) return false;
    const res = await fetch(`${API_URL}/api/progress/${encodeURIComponent(slokaId)}`, {
      method: "PUT",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Add (POST) or remove (DELETE) a "My Slokas" bookmark. */
export async function pushFavorite(
  getToken: TokenGetter,
  slokaId: string,
  inMySlokas: boolean,
): Promise<boolean> {
  if (!ready()) return false;
  try {
    const headers = await authHeader(getToken);
    if (!headers) return false;
    const res = await fetch(`${API_URL}/api/bookmarks/${encodeURIComponent(slokaId)}`, {
      method: inMySlokas ? "POST" : "DELETE",
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}
