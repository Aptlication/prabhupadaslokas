import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { Sloka } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

interface SlokaCardProps {
  sloka: Sloka;
}

export function SlokaCard({ sloka }: SlokaCardProps) {
  const colors = useColors();
  const router = useRouter();
  const { getStatus, isMySlokas } = useApp();

  const status = getStatus(sloka.id);
  const saved = isMySlokas(sloka.id);

  const statusColors: Record<string, string> = {
    learned: colors.learned,
    learning: colors.learning,
    unstarted: colors.unstarted,
  };

  const statusLabels: Record<string, string> = {
    learned: "Learned",
    learning: "Learning",
    unstarted: "Not started",
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={() => router.push(`/sloka/${sloka.id}` as never)}
      testID={`sloka-card-${sloka.id}`}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.category, { color: colors.primary }]}>{sloka.source}</Text>
          {saved && (
            <Feather name="bookmark" size={14} color={colors.primary} style={styles.bookmark} />
          )}
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>{sloka.title}</Text>
      </View>

      <Text style={[styles.firstLine, { color: colors.mutedForeground }]} numberOfLines={2}>
        {sloka.transliteration[0]}
      </Text>

      <View style={styles.footer}>
        <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
        <Text style={[styles.statusText, { color: statusColors[status] }]}>
          {statusLabels[status]}
        </Text>
        <View style={styles.spacer} />
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 10,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  category: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bookmark: {},
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  firstLine: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  spacer: {
    flex: 1,
  },
});
