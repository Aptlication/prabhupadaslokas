import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SlokaCard } from "@/components/SlokaCard";
import { useApp } from "@/context/AppContext";
import { slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export type MySlokasFilter = "saved" | "learning" | "learned";

const FILTERS: { value: MySlokasFilter; label: string; icon: FeatherIconName }[] = [
  { value: "saved", label: "Saved", icon: "bookmark" },
  { value: "learning", label: "Learning", icon: "book-open" },
  { value: "learned", label: "Learnt", icon: "check-circle" },
];

const EMPTY_COPY: Record<
  MySlokasFilter,
  { icon: FeatherIconName; title: string; text: string }
> = {
  saved: {
    icon: "bookmark",
    title: "No slokas saved yet",
    text: "Browse slokas and bookmark the ones you want to practice",
  },
  learning: {
    icon: "book-open",
    title: "Nothing in progress yet",
    text: "Open a sloka and set My Progress to “Learning” to see it here",
  },
  learned: {
    icon: "check-circle",
    title: "Nothing learnt yet",
    text: "Open a sloka and set My Progress to “Learnt” once you know it by heart",
  },
};

export default function MySlokas() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { progress, isMySlokas, getStatus } = useApp();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<MySlokasFilter>("saved");

  // Deep links from the Home stat cards pre-select a list.
  useEffect(() => {
    const requested = Array.isArray(params.filter)
      ? params.filter[0]
      : params.filter;
    if (
      requested === "saved" ||
      requested === "learning" ||
      requested === "learned"
    ) {
      setFilter(requested);
    }
  }, [params.filter]);

  const accentOf = (f: MySlokasFilter) =>
    f === "learned"
      ? colors.learned
      : f === "learning"
        ? colors.learning
        : colors.primary;

  const filtered = useMemo(() => {
    const timeOf = (id: string): string | undefined => {
      const entry = progress[id];
      if (!entry) return undefined;
      return filter === "saved" ? entry.savedAt : entry.statusChangedAt;
    };
    const list = slokas.filter((s) =>
      filter === "saved" ? isMySlokas(s.id) : getStatus(s.id) === filter,
    );
    // Most recent first; entries without a timestamp keep canonical order
    // after the timestamped ones (sort is stable).
    return [...list].sort((a, b) => {
      const ta = timeOf(a.id);
      const tb = timeOf(b.id);
      if (ta && tb) return tb.localeCompare(ta);
      if (ta) return -1;
      if (tb) return 1;
      return 0;
    });
  }, [filter, progress, isMySlokas, getStatus]);

  // Collection totals: every sloka that is saved, learning or learnt —
  // counted once for the header total, per-category for the pills.
  const totals = useMemo(() => {
    let saved = 0;
    let learning = 0;
    let learnt = 0;
    let total = 0;
    for (const s of slokas) {
      const inSaved = isMySlokas(s.id);
      const st = getStatus(s.id);
      if (inSaved) saved++;
      if (st === "learning") learning++;
      if (st === "learned") learnt++;
      if (inSaved || st !== "unstarted") total++;
    }
    return { saved, learning, learnt, total };
  }, [progress, isMySlokas, getStatus]);

  const countOf = (f: MySlokasFilter) =>
    f === "saved" ? totals.saved : f === "learning" ? totals.learning : totals.learnt;

  const empty = EMPTY_COPY[filter];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 90;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Slokas</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {totals.total} {totals.total === 1 ? "sloka" : "slokas"} in your collection · {filtered.length} {filter === "learned" ? "learnt" : filter}
        </Text>

        {/* Saved / Learning / Learned filter pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            const col = accentOf(f.value);
            return (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? col + "22" : colors.card,
                    borderColor: active ? col : colors.border,
                  },
                ]}
                onPress={() => setFilter(f.value)}
                activeOpacity={0.7}
                testID={`filter-${f.value}`}
              >
                <Feather
                  name={f.icon}
                  size={13}
                  color={active ? col : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.filterLabel,
                    {
                      color: active ? col : colors.mutedForeground,
                      fontFamily: active
                        ? "GentiumBookPlus_700Bold"
                        : "GentiumBookPlus_400Regular",
                    },
                  ]}
                >
                  {f.label} · {countOf(f.value)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SlokaCard sloka={item} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name={empty.icon} size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {empty.title}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {empty.text}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: "GentiumBookPlus_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "GentiumBookPlus_400Regular",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingTop: 70,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "GentiumBookPlus_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "GentiumBookPlus_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
