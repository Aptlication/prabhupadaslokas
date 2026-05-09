import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
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
import { slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

const RATES = [1.0, 0.75, 0.55];
const RATE_LABELS = ["1×", "0.75×", "0.55×"];
const LINE_DURATION_MS = [2000, 2700, 3600];

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getStatus, setProgress, isMySlokas, toggleMySlokas } = useApp();

  const sloka = slokas.find((s) => s.id === id);
  const [showDevanagari, setShowDevanagari] = useState(true);
  const [showPurport, setShowPurport] = useState(false);
  const [repeatMode, setRepeatMode] = useState(false);
  const [rateIdx, setRateIdx] = useState(0);
  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playingRef = useRef(false);

  if (!sloka) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Sloka not found.</Text>
      </View>
    );
  }

  const isPP = sloka.id.startsWith("pp_");
  const hasDevanagari = sloka.devanagari.length > 0;
  const hasWordByWord = sloka.word_by_word.length > 0;

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const simulateLine = (lineIdx: number, rateI: number, repeat: boolean) => {
    if (!playingRef.current) return;
    setPlayingLine(lineIdx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timerRef.current = setTimeout(() => {
      if (!playingRef.current) return;
      const next = lineIdx + 1;
      if (next < sloka.transliteration.length) {
        simulateLine(next, rateI, repeat);
      } else if (repeat) {
        setTimeout(() => {
          if (playingRef.current) simulateLine(0, rateI, repeat);
        }, 600);
      } else {
        playingRef.current = false;
        setPlayingLine(null);
      }
    }, LINE_DURATION_MS[rateI]);
  };

  const handlePlay = () => {
    if (playingRef.current) {
      playingRef.current = false;
      clearTimer();
      setPlayingLine(null);
    } else {
      playingRef.current = true;
      simulateLine(0, rateIdx, repeatMode);
    }
  };

  const handleRateCycle = () => {
    const next = (rateIdx + 1) % RATES.length;
    setRateIdx(next);
    if (playingRef.current && playingLine !== null) {
      clearTimer();
      simulateLine(playingLine, next, repeatMode);
    }
  };

  const status = getStatus(sloka.id);
  const saved = isMySlokas(sloka.id);
  const isPlaying = playingLine !== null;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
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

        {/* Devanagari toggle — only shown when there is Devanagari to display */}
        {hasDevanagari && (
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                { borderColor: colors.border },
                showDevanagari && { backgroundColor: colors.card },
              ]}
              onPress={() => setShowDevanagari(!showDevanagari)}
            >
              <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
                {showDevanagari ? "Hide" : "Show"} Devanagari
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Devanagari */}
        {hasDevanagari && showDevanagari && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>Devanagari</Text>
            {sloka.devanagari.map((line, i) => (
              <Text key={i} style={[styles.devanagari, { color: colors.goldLight }]}>
                {line}
              </Text>
            ))}
          </View>
        )}

        {/* Transliteration */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, marginTop: hasDevanagari ? 12 : 14 }]}>
          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>Transliteration</Text>
          {sloka.transliteration.map((line, i) => (
            <View
              key={i}
              style={[
                styles.transLine,
                playingLine === i && {
                  backgroundColor: colors.primary + "20",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                },
              ]}
            >
              {playingLine === i && (
                <Feather name="volume-2" size={13} color={colors.primary} style={{ marginRight: 6 }} />
              )}
              <Text
                style={[
                  styles.transText,
                  { color: playingLine === i ? colors.primary : colors.foreground },
                ]}
              >
                {line}
              </Text>
            </View>
          ))}
        </View>

        {/* Playback Controls */}
        <View style={[styles.audioBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
            onPress={handlePlay}
            testID="play-btn"
          >
            <Feather name={isPlaying ? "square" : "play"} size={18} color={colors.primaryForeground} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={[styles.audioLabel, { color: colors.foreground }]}>
              {isPlaying
                ? `Line ${(playingLine ?? 0) + 1} of ${sloka.transliteration.length}`
                : "Tap play to practice"}
            </Text>
            <Text style={[styles.audioSub, { color: colors.mutedForeground }]}>
              Line-by-line · {RATE_LABELS[rateIdx]}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              { borderColor: rateIdx !== 0 ? colors.primary : colors.border },
              rateIdx !== 0 && { backgroundColor: colors.primary + "18" },
            ]}
            onPress={handleRateCycle}
          >
            <Text style={[styles.rateLabel, { color: rateIdx !== 0 ? colors.primary : colors.mutedForeground }]}>
              {RATE_LABELS[rateIdx]}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlBtn,
              { borderColor: repeatMode ? colors.primary : colors.border },
              repeatMode && { backgroundColor: colors.primary + "18" },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRepeatMode((r) => !r);
            }}
          >
            <Feather name="repeat" size={16} color={repeatMode ? colors.primary : colors.mutedForeground} />
          </TouchableOpacity>
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
                <WordChip key={i} item={item} index={i} />
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
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
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
    fontFamily: "Inter_500Medium",
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
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  devanagari: {
    fontSize: 18,
    lineHeight: 30,
    fontFamily: "Inter_400Regular",
  },
  transLine: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  transText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    lineHeight: 24,
    flex: 1,
  },
  audioBar: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  audioLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  audioSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rateLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  translation: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
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
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
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
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  rankLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  metaCell: {
    gap: 2,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  metaKey: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
});
