import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION_LABEL,
} from "@/constants/app";
import { slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getStatus, theme, setTheme } = useApp();
  const isNight = theme === "night";

  const learned = slokas.filter((s) => getStatus(s.id) === "learned").length;
  const learning = slokas.filter((s) => getStatus(s.id) === "learning").length;
  const total = slokas.length;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 90;

  const infoRows = [
    { icon: "book-open", label: "Total Slokas", value: String(total) },
    { icon: "check-circle", label: "Learned", value: String(learned) },
    { icon: "clock", label: "In Progress", value: String(learning) },
    {
      icon: "target",
      label: "Completion",
      value: `${Math.round((learned / total) * 100)}%`,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad + 16,
        paddingBottom: bottomPad,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Settings
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your learning progress
        </Text>
      </View>

      {/* Appearance — paper (off-white) / night (off-black) reading theme */}
      <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 28 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.row,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
            <Feather
              name={isNight ? "moon" : "sun"}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              Night mode
            </Text>
            <Text style={[styles.rowHint, { color: colors.mutedForeground }]}>
              {isNight ? "Off-black reading" : "Off-white reading"}
            </Text>
          </View>
          <Switch
            value={isNight}
            onValueChange={(on) => setTheme(on ? "night" : "paper")}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
            ios_backgroundColor={colors.border}
            testID="night-mode-switch"
          />
        </View>
      </View>

      {/* Progress Overview */}
      <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 28 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          PROGRESS OVERVIEW
        </Text>
        {infoRows.map((row) => (
          <View
            key={row.label}
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather
                name={row.icon as any}
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              {row.label}
            </Text>
            <Text style={[styles.rowValue, { color: colors.primary }]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      {/* About */}
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          ABOUT
        </Text>
        <View
          style={[
            styles.aboutCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.aboutTitle, { color: colors.primary }]}>
            {APP_NAME}
          </Text>
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
  title: { fontSize: 28, fontFamily: "GentiumBookPlus_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "GentiumBookPlus_400Regular", marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "GentiumBookPlus_700Bold",
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
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "GentiumBookPlus_400Regular" },
  rowHint: { fontSize: 12, fontFamily: "GentiumBookPlus_400Regular", marginTop: 1 },
  rowValue: { fontSize: 16, fontFamily: "GentiumBookPlus_700Bold" },
  aboutCard: { borderRadius: 14, borderWidth: 1, padding: 18, gap: 8 },
  aboutTitle: { fontSize: 20, fontFamily: "GentiumBookPlus_700Bold" },
  aboutTagline: {
    fontSize: 13,
    fontFamily: "GentiumBookPlus_400Regular",
    fontStyle: "italic",
  },
  aboutDesc: { fontSize: 14, fontFamily: "GentiumBookPlus_400Regular", lineHeight: 21 },
  divider: { height: 1, marginVertical: 4 },
  version: { fontSize: 12, fontFamily: "GentiumBookPlus_400Regular" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  btnPrimary: {
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
