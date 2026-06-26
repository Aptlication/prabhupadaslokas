import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { Sloka } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

interface SlokaCardProps {
  sloka: Sloka;
  /** Ordered ids of the list this card belongs to, so the detail screen can
   *  walk prev/next within the same context the user is browsing. */
  listIds?: string[];
}

/** Build the navigation target, carrying the browsing context as a `list` param. */
function slokaHref(id: string, listIds?: string[]) {
  return {
    pathname: "/sloka/[id]" as const,
    params: listIds?.length ? { id, list: listIds.join(",") } : { id },
  };
}

function PPSlokaCard({ sloka, listIds, colors, router }: { sloka: Sloka; listIds?: string[]; colors: ReturnType<typeof useColors>; router: ReturnType<typeof useRouter> }) {
  const { getStatus, isMySlokas } = useApp();
  const status = getStatus(sloka.id);
  const saved = isMySlokas(sloka.id);

  const statusColors: Record<string, string> = {
    learned: colors.learned,
    learning: colors.learning,
    unstarted: colors.unstarted,
  };

  return (
    <TouchableOpacity
      style={[styles.ppCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={() => router.push(slokaHref(sloka.id, listIds) as never)}
      testID={`sloka-card-${sloka.id}`}
    >
      <View style={styles.ppRow}>
        {/* Rank badge */}
        <View style={[styles.rankBadge, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.rankText, { color: colors.primary }]}>
            #{sloka.rank}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.ppContent}>
          <View style={styles.ppTitleRow}>
            <Text
              style={[styles.ppIncipit, { color: colors.foreground }]}
              numberOfLines={1}
            >
              {sloka.title}
            </Text>
            {saved && (
              <Feather name="bookmark" size={13} color={colors.primary} />
            )}
          </View>

          {sloka.chapter_verse ? (
            <Text style={[styles.ppRef, { color: colors.mutedForeground }]}>
              {sloka.chapter_verse}
            </Text>
          ) : null}

          <Text
            style={[styles.ppTheme, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {sloka.translation}
          </Text>
        </View>

        {/* Status + chevron */}
        <View style={styles.ppRight}>
          <View
            style={[styles.statusDot, { backgroundColor: statusColors[status] }]}
          />
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function FullSlokaCard({ sloka, listIds, colors, router }: { sloka: Sloka; listIds?: string[]; colors: ReturnType<typeof useColors>; router: ReturnType<typeof useRouter> }) {
  const { getStatus, isMySlokas } = useApp();
  const status = getStatus(sloka.id);
  const saved = isMySlokas(sloka.id);

  const statusColors: Record<string, string> = {
    learned: colors.learned,
    learning: colors.learning,
    unstarted: colors.unstarted,
  };

  const statusLabels: Record<string, string> = {
    learned: "Learnt",
    learning: "Learning",
    unstarted: "Not started",
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.75}
      onPress={() => router.push(slokaHref(sloka.id, listIds) as never)}
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

export function SlokaCard({ sloka, listIds }: SlokaCardProps) {
  const colors = useColors();
  const router = useRouter();

  if (sloka.id.startsWith("pp_")) {
    return <PPSlokaCard sloka={sloka} listIds={listIds} colors={colors} router={router} />;
  }
  return <FullSlokaCard sloka={sloka} listIds={listIds} colors={colors} router={router} />;
}

const styles = StyleSheet.create({
  // Full BGAII card
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 10,
  },
  header: { gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  category: {
    fontSize: 11,
    fontFamily: "GentiumBookPlus_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  bookmark: {},
  title: { fontSize: 17, fontFamily: "GentiumBookPlus_700Bold" },
  firstLine: {
    fontSize: 13,
    fontFamily: "GentiumBookPlus_400Regular",
    fontStyle: "italic",
    lineHeight: 20,
  },
  footer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "GentiumBookPlus_400Regular" },
  spacer: { flex: 1 },

  // PP compact card
  ppCard: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  ppRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rankText: {
    fontSize: 12,
    fontFamily: "GentiumBookPlus_700Bold",
  },
  ppContent: {
    flex: 1,
    gap: 2,
  },
  ppTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ppIncipit: {
    flex: 1,
    fontSize: 14,
    fontFamily: "GentiumBookPlus_700Bold",
    fontStyle: "italic",
  },
  ppRef: {
    fontSize: 11,
    fontFamily: "GentiumBookPlus_400Regular",
    letterSpacing: 0.2,
  },
  ppTheme: {
    fontSize: 12,
    fontFamily: "GentiumBookPlus_400Regular",
  },
  ppRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
});
