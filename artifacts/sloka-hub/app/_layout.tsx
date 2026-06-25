import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/clerk-expo";
import {
  GentiumBookPlus_400Regular,
  GentiumBookPlus_400Regular_Italic,
  GentiumBookPlus_700Bold,
  useFonts,
} from "@expo-google-fonts/gentium-book-plus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ClerkSyncBridge } from "@/components/auth/ClerkSyncBridge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AppProvider } from "@/context/AppContext";
import { CLERK_PUBLISHABLE_KEY, isClerkConfigured } from "@/lib/auth/config";
import { tokenCache } from "@/lib/auth/tokenCache";
import { useAuthSync } from "@/lib/auth/useAuthSync";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Redirects between the (auth) stack and the app based on session state, and
 * keeps the backend `users` row in sync once signed in. Mounted inside
 * ClerkProvider so the Clerk hooks are available.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useAuthSync();

  useEffect(() => {
    if (!isLoaded) return;
    // Browse-open: signed-out users may use the app. Only bounce a signed-in
    // user off the auth screens back into the app.
    if (isSignedIn && segments[0] === "(auth)") {
      router.replace("/(tabs)");
    }
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) return <LoadingScreen />;
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="sloka/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

/**
 * The app tree below the auth layer. When Clerk is configured we wrap it in
 * ClerkProvider + the ClerkSyncBridge (which feeds the session into AppContext)
 * + AuthGate. Browsing is open; signing in is required only to save/sync (see
 * AppContext.ensureAuth). If no publishable key is present (e.g. a local build
 * before EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set) we render the app ungated so
 * it still runs — auth switches on the moment the key is provided.
 */
function AppTree() {
  if (!isClerkConfigured) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        "[auth] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY not set — running without login.",
      );
    }
    return <RootLayoutNav />;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ClerkSyncBridge />
        <AuthGate>
          <RootLayoutNav />
        </AuthGate>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default function RootLayout() {
  // Gentium Book Plus — an old-style book serif with full IAST/Sanskrit
  // diacritic coverage. Loaded from its Google Fonts package (same mechanism the
  // app used for Inter). The family ships in two weights (400/700); the verse
  // transliteration uses the true italic face for a typeset look.
  const [fontsLoaded, fontError] = useFonts({
    GentiumBookPlus_400Regular,
    GentiumBookPlus_700Bold,
    GentiumBookPlus_400Regular_Italic,
  });
  const [fontTimeout, setFontTimeout] = React.useState(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Safety valve: if fonts hang for >3 s, show app anyway
  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // PWA: register the service worker on web for offline + install-to-home-screen.
  useEffect(() => {
    if (
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      const onLoad = () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("SW registration failed", err);
        });
      };
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
    }
  }, []);

  if (!fontsLoaded && !fontError && !fontTimeout) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <AppTree />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
