// lib/api.ts — thin client for the Cloudflare Pages Functions API.
//
// All calls are same-origin with credentials, so the Access `CF_Authorization`
// cookie rides along automatically once the user has logged in. Everything is
// web-only and fails soft: on native, or when logged out / offline, calls
// resolve to a benign value and the app keeps using local storage.

import { Platform } from "react-native";

const isWeb = Platform.OS === "web" && typeof window !== "undefined";

export type Status = "unstarted" | "learning" | "learned";
export interface SlokaState {
  status: Status;
  inMySlokas: boolean;
  savedAt: string | null;
}
export type StateMap = Record<string, SlokaState>;

async function postJSON(path: string, body: unknown): Promise<boolean> {
  if (!isWeb) return false;
  try {
    const res = await fetch(path, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Are we logged in via Access? Reads the Access identity endpoint. */
export async function checkAuth(): Promise<{ loggedIn: boolean; email: string | null }> {
  if (!isWeb) return { loggedIn: false, email: null };
  try {
    const res = await fetch("/cdn-cgi/access/get-identity", { credentials: "include" });
    if (!res.ok) return { loggedIn: false, email: null };
    const data = (await res.json()) as { email?: string };
    return { loggedIn: true, email: data.email ?? null };
  } catch {
    return { loggedIn: false, email: null };
  }
}

/** Fetch the full cloud state, or null if not logged in / unavailable. */
export async function fetchState(): Promise<StateMap | null> {
  if (!isWeb) return null;
  try {
    const res = await fetch("/api/state", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as { progress?: StateMap };
    return data.progress ?? {};
  } catch {
    return null;
  }
}

/** Bulk-push a local map to the cloud (first-login migration). Returns the
 *  server's merged map, or null on failure. */
export async function importState(progress: StateMap): Promise<StateMap | null> {
  if (!isWeb) return null;
  try {
    const res = await fetch("/api/state", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ progress }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { progress?: StateMap };
    return data.progress ?? {};
  } catch {
    return null;
  }
}

export const pushProgress = (slokaId: string, status: Status) =>
  postJSON("/api/progress", { slokaId, status });

export const pushFavorite = (slokaId: string, inMySlokas: boolean) =>
  postJSON("/api/favorites", { slokaId, inMySlokas });

/** Send the browser through the Access login, returning to the app afterwards. */
export function login(): void {
  if (isWeb) window.location.href = "/api/login";
}

/** Clear the Access session, then return to the app. */
export function logout(): void {
  if (isWeb) window.location.href = "/cdn-cgi/access/logout";
}
