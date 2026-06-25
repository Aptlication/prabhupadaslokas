/**
 * Settings → Account section (web, Clerk-gated).
 *
 * Signed in  → <SignOutButton/> (email + sign out).
 * Signed out → a "sign in to sync" card that routes to the Clerk sign-in screen.
 *
 * The hook-using inner component only mounts when Clerk is configured (and on
 * web), so Clerk hooks are never called without a ClerkProvider above them.
 */
import { useAuth } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { isClerkConfigured } from "@/lib/auth/config";
import { useColors } from "@/hooks/useColors";

export function AccountSection() {
  if (Platform.OS !== "web" || !isClerkConfigured) return null;
  return <AccountSectionInner />;
}

function AccountSectionInner() {
  const c = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  return (
    <View style={styles.wrap}>
      {isSignedIn ? (
        <SignOutButton />
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
            ACCOUNT
          </Text>
          <View
            style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <Text style={[styles.title, { color: c.primary }]}>
              Sync across devices
            </Text>
            <Text style={[styles.desc, { color: c.mutedForeground }]}>
              Sign in to save your progress and My Slokas to your account, so they
              follow you to any device. Your data stays on this device until you do.
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              style={[styles.btn, { backgroundColor: c.primary }]}
            >
              <Feather name="log-in" size={16} color={c.background} />
              <Text style={[styles.btnText, { color: c.background }]}>Sign in</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 10, marginBottom: 28 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "GentiumBookPlus_700Bold",
    letterSpacing: 1,
  },
  card: { borderRadius: 14, borderWidth: 1, padding: 18, gap: 8 },
  title: { fontSize: 20, fontFamily: "GentiumBookPlus_700Bold" },
  desc: { fontSize: 14, fontFamily: "GentiumBookPlus_400Regular", lineHeight: 21 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 6,
  },
  btnText: { fontSize: 15, fontFamily: "GentiumBookPlus_700Bold" },
});
