import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getStatus } = useApp();

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
        <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.aboutTitle, { color: colors.primary }]}>Sloka Hub</Text>
          <Text style={[styles.aboutTagline, { color: colors.mutedForeground }]}>
            Learn it. Live it. Lead it.
          </Text>
          <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
            Sloka Hub helps ISKCON devotees learn slokas, improve pronunciation, understand meanings, and memorize them effectively through structured practice.
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.version, { color: colors.mutedForeground }]}>Version 1.0.0 — Phase 1 MVP</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
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
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  rowValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  aboutCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  aboutTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  aboutTagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  aboutDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  version: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
