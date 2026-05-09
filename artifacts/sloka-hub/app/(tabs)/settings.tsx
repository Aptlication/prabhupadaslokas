import { Feather } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp, type SyncState } from "@/context/AppContext";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE, APP_VERSION_LABEL } from "@/constants/app";
import { slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

function SyncBadge({ syncState, lastSynced }: { syncState: SyncState; lastSynced: Date | null }) {
  const colors = useColors();
  const spin = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (syncState === "syncing") {
      anim.current = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== "web",
        }),
      );
      anim.current.start();
    } else {
      anim.current?.stop();
      spin.setValue(0);
    }
  }, [syncState, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  function formatRelative(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin === 1) return "1 min ago";
    if (diffMin < 60) return `${diffMin} min ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (syncState === "syncing") {
    return (
      <View style={styles.syncRow}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="refresh-cw" size={11} color={colors.mutedForeground} />
        </Animated.View>
        <Text style={[styles.syncText, { color: colors.mutedForeground }]}>Syncing…</Text>
      </View>
    );
  }

  if (syncState === "pending") {
    return (
      <View style={styles.syncRow}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="upload-cloud" size={11} color={colors.learning} />
        </Animated.View>
        <Text style={[styles.syncText, { color: colors.learning }]}>Pending sync</Text>
      </View>
    );
  }

  if (syncState === "error") {
    return (
      <View style={styles.syncRow}>
        <Feather name="alert-circle" size={11} color={colors.destructive} />
        <Text style={[styles.syncText, { color: colors.destructive }]}>Sync failed</Text>
      </View>
    );
  }

  if (syncState === "synced" && lastSynced) {
    return (
      <View style={styles.syncRow}>
        <Feather name="cloud" size={11} color={colors.primary} />
        <Text style={[styles.syncText, { color: colors.primary }]}>
          Synced {formatRelative(lastSynced)}
        </Text>
      </View>
    );
  }

  return null;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getStatus, syncState, lastSynced } = useApp();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const learned = slokas.filter((s) => getStatus(s.id) === "learned").length;
  const learning = slokas.filter((s) => getStatus(s.id) === "learning").length;
  const total = slokas.length;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 90;

  const infoRows = [
    { icon: "book-open", label: "Total Slokas", value: String(total) },
    { icon: "check-circle", label: "Learned", value: String(learned) },
    { icon: "clock", label: "In Progress", value: String(learning) },
    { icon: "target", label: "Completion", value: `${Math.round((learned / total) * 100)}%` },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your learning progress
        </Text>
      </View>

      {/* Account Section */}
      <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 28 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        {isSignedIn ? (
          <View
            style={[
              styles.accountCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
              <Feather name="user" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountName, { color: colors.foreground }]}>
                {user?.fullName || "Devotee"}
              </Text>
              <Text style={[styles.accountEmail, { color: colors.mutedForeground }]}>
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
              <SyncBadge syncState={syncState} lastSynced={lastSynced} />
            </View>
            <Pressable
              onPress={() => signOut()}
              style={[styles.signOutBtn, { borderColor: colors.destructive }]}
            >
              <Feather name="log-out" size={14} color={colors.destructive} />
              <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={[
              styles.accountCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
              <Feather name="user" size={22} color={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountName, { color: colors.foreground }]}>Guest</Text>
              <Text style={[styles.accountEmail, { color: colors.mutedForeground }]}>
                Sign in to sync your progress across devices
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.signInText, { color: colors.background }]}>Sign In</Text>
            </Pressable>
          </View>
        )}
        {!isSignedIn && (
          <Pressable
            onPress={() => router.push("/(auth)/sign-up")}
            style={[styles.createAccountBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.createAccountText, { color: colors.primary }]}>
              Create a free account
            </Text>
          </Pressable>
        )}
      </View>

      {/* Progress Overview */}
      <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 28 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          PROGRESS OVERVIEW
        </Text>
        {infoRows.map((row) => (
          <View
            key={row.label}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name={row.icon as any} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>{row.label}</Text>
            <Text style={[styles.rowValue, { color: colors.primary }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* About */}
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ABOUT</Text>
        <View
          style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.aboutTitle, { color: colors.primary }]}>{APP_NAME}</Text>
          <Text style={[styles.aboutTagline, { color: colors.mutedForeground }]}>
            {APP_TAGLINE}
          </Text>
          <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
            {APP_DESCRIPTION}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.version, { color: colors.mutedForeground }]}>
            {APP_VERSION_LABEL}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  accountName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  accountEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  syncRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  syncText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  signInBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signInText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  createAccountBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  createAccountText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  rowValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  aboutCard: { borderRadius: 14, borderWidth: 1, padding: 18, gap: 8 },
  aboutTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  aboutTagline: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  aboutDesc: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  divider: { height: 1, marginVertical: 4 },
  version: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
