import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getStatus, progress } = useApp();

  const totalLearned = slokas.filter((s) => getStatus(s.id) === "learned").length;
  const totalLearning = slokas.filter((s) => getStatus(s.id) === "learning").length;
  const totalSaved = Object.values(progress).filter((p) => p.inMySlokas).length;

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad + 16, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.heroSection}>
        <View style={styles.logoRow}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View>
            <Text style={[styles.appName, { color: colors.primary }]}>Sloka Hub</Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Learn it. Live it. Lead it.
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.learned }]}>{totalLearned}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Learned</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.learning }]}>{totalLearning}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Learning</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{totalSaved}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Saved</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Practice</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}
            activeOpacity={0.75}
            onPress={() => router.push("/(tabs)/slokas" as never)}
            testID="start-learning-btn"
          >
            <LinearGradient
              colors={[colors.primary + "30", colors.primary + "08"]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Feather name="book-open" size={28} color={colors.primary} />
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>Start Learning</Text>
            <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
              {slokas.length} slokas available
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.75}
            onPress={() => router.push("/(tabs)/my-slokas" as never)}
            testID="my-slokas-btn"
          >
            <Feather name="bookmark" size={28} color={colors.mutedForeground} />
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>My Slokas</Text>
            <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
              {totalSaved} saved
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Coming Soon */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Coming Soon</Text>
        {[
          { icon: "music", label: "Kirtan Learning", desc: "Learn traditional bhajans" },
          { icon: "cpu", label: "AI Tutor", desc: "Personalized pronunciation help" },
          { icon: "users", label: "Group Learning", desc: "Study with devotees" },
        ].map((item) => (
          <View
            key={item.label}
            style={[styles.comingSoonCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.comingSoonIcon, { backgroundColor: colors.muted }]}>
              <Feather name={item.icon as any} size={20} color={colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.comingSoonDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
            </View>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.comingSoonBadgeText, { color: colors.mutedForeground }]}>
                Soon
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    overflow: "hidden",
    minHeight: 130,
  },
  actionGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  actionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  actionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  comingSoonCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  comingSoonIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  comingSoonTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  comingSoonDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
