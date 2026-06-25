/**
 * Auth stack. Only reachable while signed OUT — if a signed-in user lands here
 * (e.g. via a deep link), bounce them to the app. The inverse guard (sending
 * signed-out users *into* this stack) lives in the root layout.
 */
import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
