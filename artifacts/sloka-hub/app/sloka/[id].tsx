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
  const [playingLine, setPlayingLine] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!sloka) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Sloka not found.</Text>
      </View>
    );
  }

  const status = getStatus(sloka.id);
  const saved = isMySlokas(sloka.id);

  const simulateLine = (lineIdx: number) => {
    setPlayingLine(lineIdx);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    timerRef.current = setTimeout(() => {
      if (lineIdx + 1 < sloka.transliteration.length) {
        simulateLine(lineIdx + 1);
      } else {
        if (repeatMode) {
          setTimeout(() => simulateLine(0), 600);
        } else {
          setPlayingLine(null);
        }
      }
    }, 1800);
  };

  const handlePlay = () => {
    if (playingLine !== null) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPlayingLine(null);
    } else {
      simulateLine(0);
    }
  };

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
            name={saved ? "bookmark" : "bookmark"}
            size={22}
            color={saved ? colors.primary : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Devanagari toggle */}
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

        {/* Devanagari */}
        {showDevanagari && sloka.devanagari.length > 0 && (
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
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTag, { color: colors.mutedForeground }]}>Transliteration</Text>
          {sloka.transliteration.map((line, i) => (
            <View
              key={i}
              style={[
                styles.transLine,
                playingLine === i && { backgroundColor: colors.primary + "20", borderRadius: 8, paddingHorizontal: 8 },
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

        {/* Audio Controls */}
        <View style={[styles.audioBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.playBtn, { backgroundColor: colors.primary }]}
            onPress={handlePlay}
            testID="play-btn"
          >
            <Feather name={playingLine !== null ? "square" : "play"} size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.audioLabel, { color: colors.foreground }]}>
              {playingLine !== null
                ? `Line ${(playingLine ?? 0) + 1} of ${sloka.transliteration.length}`
                : "Tap play to practice"}
            </Text>
            <Text style={[styles.audioSub, { color: colors.mutedForeground }]}>Line-by-line mode</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.repeatBtn,
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

        {/* Word-by-Word */}
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

        {/* Purport */}
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
    gap: 12,
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
  repeatBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
