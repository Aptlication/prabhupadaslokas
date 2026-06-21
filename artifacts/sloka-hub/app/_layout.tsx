import {
  GentiumBookPlus_400Regular,
  GentiumBookPlus_400Regular_Italic,
  GentiumBookPlus_700Bold,
  useFonts,
} from "@expo-google-fonts/gentium-book-plus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="sloka/[id]" options={{ headerShown: false }} />
    </Stack>
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
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
