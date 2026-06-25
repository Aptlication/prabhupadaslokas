/**
 * Sign-out control for the Settings screen. Shows the signed-in email and a
 * button that ends the Clerk session; the root AuthGate then routes back to
 * sign-in. Renders nothing when auth isn't configured (local-only build).
 *
 * To use, drop <SignOutButton /> into an "ACCOUNT" section of
 * app/(tabs)/settings.tsx (see HANDOFF for the exact snippet).
 */
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { isClerkConfigured } from "@/lib/auth/config";
import { useColors } from "@/hooks/useColors";

export function SignOutButton() {
  const c = useColors();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [busy, setBusy] = useState(false);

  if (!isClerkConfigured || !isSignedIn) return null;

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "Signed in";

  const onSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>
        ACCOUNT
      </Text>
      <View
        style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <View style={[styles.rowIcon, { backgroundColor: c.muted }]}>
          <Feather name="user" size={18} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowLabel, { color: c.foreground }]}>
            Signed in
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.rowHint, { color: c.mutedForeground }]}
          >
            {email}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={onSignOut}
        disabled={busy}
        style={[
          styles.row,
          { backgroundColor: c.card, borderColor: c.border, opacity: busy ? 0.6 : 1 },
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: c.muted }]}>
          <Feather name="log-out" size={18} color={c.destructive} />
        </View>
        <Text style={[styles.rowLabel, { color: c.destructive, flex: 1 }]}>
          {busy ? "Signing out…" : "Sign out"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 12,
    fontFamily: "GentiumBookPlus_700Bold",
    letterSpacing: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontFamily: "GentiumBookPlus_700Bold" },
  rowHint: { fontSize: 12, fontFamily: "GentiumBookPlus_400Regular", marginTop: 2 },
});
