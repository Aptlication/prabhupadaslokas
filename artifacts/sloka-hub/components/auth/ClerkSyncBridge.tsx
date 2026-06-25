/**
 * Bridges Clerk session state into AppContext.
 *
 * AppProvider is mounted above ClerkProvider, so AppContext can't call Clerk
 * hooks itself. This component lives inside ClerkProvider, reads the session via
 * Clerk hooks, and pushes { isSignedIn, getToken, email } into the context. The
 * context uses that to authorise cloud sync and to drive the browse-open
 * "sign-in to save" gate. Renders nothing.
 */
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";

import { useApp } from "@/context/AppContext";

export function ClerkSyncBridge() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { syncAuth } = useApp();

  useEffect(() => {
    const email =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      null;
    syncAuth({ isSignedIn: !!isSignedIn, getToken, email });
  }, [isSignedIn, user, getToken, syncAuth]);

  return null;
}
