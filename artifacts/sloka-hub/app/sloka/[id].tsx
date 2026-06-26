import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressSelector } from "@/components/ProgressBadge";
import { WordChip } from "@/components/WordChip";
import { useApp } from "@/context/AppContext";
import { groupBySourceAndChapter, slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

// The global fallback order (source → chapter_verse) used when the detail screen
// is opened without a list context (e.g. a deep link or page reload).
const globalOrderIds = groupBySourceAndChapter(slokas)
  .flatMap((sec) => sec.data)
  .map((s) => s.id);

function PPMetaRow({
  rank,
  timesQuoted,
  source,
  chapterVerse,
}: {
  rank: number;
  timesQuoted?: number;
  source: string;
  chapterVerse?: string;
}) {
  const colors = useColors();
  return (
    <View style={[ppStyles.metaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Rank badge */}
      <View style={[ppStyles.rankBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
        <Text style={[ppStyles.rankNum, { color: colors.primary }]}>#{rank}</Text>
        <Text style={[ppStyles.rankLabel, { color: colors.mutedForeground }]}>rank</Text>
      </View>

      <View style={ppStyles.metaDivider} />

      {/* Frequency */}
      {timesQuoted != null && (
        <>
          <View style={ppStyles.metaCell}>
            <Text style={[ppStyles.metaValue, { color: colors.foreground }]}>~{timesQuoted}×</Text>
            <Text style={[ppStyles.metaKey, { color: colors.mutedForeground }]}>quoted</Text>
          </View>
          <View style={ppStyles.metaDivider} />
        </>
      )}

      {/* Source + verse */}
      <View style={[ppStyles.metaCell, { flex: 1 }]}>
        <Text style={[ppStyles.metaValue, { color: colors.foreground }]} numberOfLines={1}>{source}</Text>
        {chapterVerse ? (
          <Text style={[ppStyles.metaKey, { color: colors.mutedForeground }]}>{chapterVerse}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function SlokaDetail() {
  const { id, list } = useLocalSearchParams<{ id: string; list?: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getStatus, setProgress, isMySlokas, toggleMySlokas } = useApp();

  const [showPurport, setShowPurport] = useState(false);

  // Each verse opens fresh: collapse the Purport when prev/next switches verse.
  // (The word-by-word chips reset via their `key` below, which remounts them.)
  useEffect(() => {
    setShowPurport(false);
  }, [id]);

  // The ordered ids the user is walking: the list context they came from
  // (My Slokas, the chapter/source view, or search results), restricted to the
  // 180-set, falling back to the global order when there's no context.
  const orderedIds = useMemo(() => {
    if (list) {
      const valid = new Set(globalOrderIds);
      const ids = list.split(",").filter((x) => valid.has(x));
      if (ids.length) return ids;
    }
    return globalOrderIds;
  }, [list]);

  const index = orderedIds.indexOf(typeof id === "string" ? id : "");
  const prevId = index > 0 ? orderedIds[index - 1] : undefined;
  const nextId =
    index >= 0 && index < orderedIds.length - 1 ? orderedIds[index + 1] : undefined;

  const go = (targetId?: string) => {
    if (!targetId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace({
      pathname: "/sloka/[id]",
      params: list ? { id: targetId, list } : { id: targetId },
    });
  };

  // Horizontal swipe: left → next, right → prev. A ref keeps the handler fresh
  // while the PanResponder is created once; the move-claim only fires on a
  // horizontal-dominant gesture so vertical scrolling still works.
  const swipeRef = useRef<(dir: -1 | 1) => void>(() => {});
  swipeRef.current = (dir) => go(dir === 1 ? nextId : prevId);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -50) swipeRef.current(1);
        else if (g.dx >= 50) swipeRef.current(-1);
      },
    }),
  ).current;

  const sloka = slokas.find((s) => s.id === id);

  if (!sloka) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Sloka not found.</Text>
      </View>
    );
  }

  const isPP = sloka.id.startsWith("pp_");
  const hasWordByWord = sloka.word_by_word.length > 0;

  const status = getStatus(sloka.id);
  const saved = isMySlokas(sloka.id);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      {...pan.panHandlers}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-btn">
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerSource, { color: colors.primary }]} numberOfLines={1}>
            {sloka.source}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {sloka.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleMySlokas(sloka.id);
          }}
          style={styles.bookmarkBtn}
          testID="bookmark-btn"
        >
          <Feather
            name="bookmark"
            size={22}
            color={saved ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PP Metadata row */}
        {isPP && sloka.rank != null && (
          <View style={{ marginTop: 14, marginHorizontal: 16 }}>
            <PPMetaRow
              rank={sloka.rank}
              timesQuoted={sloka.times_quoted_approx}
              source={sloka.source}
              chapterVerse={sloka.chapter_verse}
            />
          </View>
        )}

        {/* Transliteration */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 14 }]}>
          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>Transliteration</Text>
          {sloka.transliteration.map((line, i) => (
            <View key={i} style={styles.transLine}>
              <Text style={[styles.transText, { color: colors.foreground }]}>
                {line}
              </Text>
            </View>
          ))}
        </View>

        {/* Translation */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>Translation</Text>
          <Text style={[styles.translation, { color: colors.foreground }]}>{sloka.translation}</Text>
        </View>

        {/* Word-by-Word — only shown when data is present */}
        {hasWordByWord && (
          <View style={styles.wordSection}>
            <Text style={[styles.sectionTag, { color: colors.mutedForeground, paddingHorizontal: 16 }]}>
              Word by Word — tap each word
            </Text>
            <View style={styles.wordGrid}>
              {sloka.word_by_word.map((item, i) => (
                <WordChip key={`${sloka.id}-${i}`} item={item} index={i} />
              ))}
            </View>
          </View>
        )}

        {/* Purport — only shown when data is present */}
        {sloka.purport && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={styles.purportHeader}
              onPress={() => setShowPurport(!showPurport)}
            >
              <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>Purport</Text>
              <Feather
                name={showPurport ? "chevron-up" : "chevron-down"}
                size={16}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
            {showPurport && (
              <Text style={[styles.purportText, { color: colors.mutedForeground }]}>
                {sloka.purport}
              </Text>
            )}
          </View>
        )}

        {/* Progress */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>My Progress</Text>
          <ProgressSelector
            status={status}
            onPress={(s) => setProgress(sloka.id, s)}
          />
        </View>
      </ScrollView>

      {/* Prev / Next bar — walks the list context the user came from */}
      <View
        style={[
          styles.navBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: bottomPad,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => go(prevId)}
          disabled={!prevId}
          style={[styles.navBtn, { opacity: prevId ? 1 : 0.35 }]}
          testID="prev-btn"
        >
          <Feather name="chevron-left" size={18} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>Prev</Text>
        </TouchableOpacity>

        {index >= 0 && (
          <Text style={[styles.navPos, { color: colors.mutedForeground }]}>
            {index + 1} / {orderedIds.length}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => go(nextId)}
          disabled={!nextId}
          style={[styles.navBtn, { opacity: nextId ? 1 : 0.35 }]}
          testID="next-btn"
        >
          <Text style={[styles.navText, { color: colors.primary }]}>Next</Text>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { padding: 6 },
  bookmarkBtn: { padding: 6 },
  headerSource: {
    fontSize: 11,
    fontFamily: "GentiumBookPlus_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "GentiumBookPlus_700Bold",
    marginTop: 1,
  },
  toggleRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  toggleBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 12,
    fontFamily: "GentiumBookPlus_400Regular",
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  sectionTag: {
    fontSize: 11,
    fontFamily: "GentiumBookPlus_700Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  transText: {
    fontSize: 18,
    fontFamily: "GentiumBookPlus_400Regular_Italic",
    lineHeight: 27,
    flex: 1,
  },
  translation: {
    fontSize: 15,
    fontFamily: "GentiumBookPlus_400Regular",
    lineHeight: 23,
  },
  wordSection: {
    marginTop: 16,
    gap: 12,
  },
  wordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  purportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  purportText: {
    fontSize: 14,
    fontFamily: "GentiumBookPlus_400Regular",
    lineHeight: 22,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
  },
  navText: {
    fontSize: 14,
    fontFamily: "GentiumBookPlus_700Bold",
  },
  navPos: {
    fontSize: 12,
    fontFamily: "GentiumBookPlus_400Regular",
    letterSpacing: 0.3,
  },
});

const ppStyles = StyleSheet.create({
  metaCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  rankBadge: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
  },
  rankNum: {
    fontSize: 15,
    fontFamily: "GentiumBookPlus_700Bold",
    lineHeight: 18,
  },
  rankLabel: {
    fontSize: 9,
    fontFamily: "GentiumBookPlus_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(120,90,60,0.20)",
  },
  metaCell: {
    gap: 2,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "GentiumBookPlus_700Bold",
  },
  metaKey: {
    fontSize: 10,
    fontFamily: "GentiumBookPlus_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
