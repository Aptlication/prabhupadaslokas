/**
 * useAuthSync — best-effort upsert of the signed-in user into our backend.
 *
 * Mirrors the api-server contract: POST /api/auth/sync with a Clerk-issued
 * bearer token and `{ email, displayName }`; the server keys the row on the
 * Clerk user id it reads from the token (see api-server/src/routes/auth.ts).
 *
 * This is intentionally fire-and-forget: the current build is a local-only PWA
 * with no API deployed (EXPO_PUBLIC_API_URL unset), so a missing/failing sync
 * must never block the user from using the app. When the backend is live, set
 * EXPO_PUBLIC_API_URL and this begins provisioning users on first sign-in.
 */
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useRef } from "react";

import { API_URL } from "./config";

export function useAuthSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    if (!API_URL) return; // local-only PWA — nothing to sync to
    if (syncedFor.current === user.id) return; // already synced this session

    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;
    if (!email) return;

    const displayName =
      user.fullName ?? user.firstName ?? user.username ?? undefined;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch(`${API_URL}/api/auth/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ email, displayName }),
        });
        if (!cancelled && res.ok) {
          syncedFor.current = user.id;
        }
      } catch {
        // Offline or no backend — ignore; the app works without it.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, getToken]);
}
