/**
 * useGoogleAuth — wraps Clerk's SSO flow for the "Continue with Google" button.
 *
 * Works on both web and native:
 *  - web: Clerk performs a redirect round-trip in the same tab.
 *  - native: opens an in-app browser (expo-web-browser) and returns to the
 *    app via the expo-auth-session redirect URL.
 *
 * Enable the Google provider in the Clerk Auth pane for this to succeed.
 */
import { useSSO } from "@clerk/clerk-expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

// Required on native so the in-app browser dismisses and hands control back.
export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export function useGoogleAuth() {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
      // If no session was created, Clerk needs more steps (e.g. a brand-new
      // account that must pick a username); the hosted flow handles those.
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Google sign-in failed. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow]);

  return { signInWithGoogle, loading, error };
}
