import { Feather } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SlokaCard } from "@/components/SlokaCard";
import { Sloka, groupBySource, sourceTexts, slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

export default function SlokasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const sectionListRef = useRef<SectionList<Sloka>>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return slokas.filter((s) => {
      const matchSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.transliteration.join(" ").toLowerCase().includes(q) ||
        s.source.toLowerCase().includes(q) ||
        s.translation.toLowerCase().includes(q) ||
        (s.chapter_verse ?? "").toLowerCase().includes(q);
      const matchSource = !selectedSource || s.source === selectedSource;
      return matchSearch && matchSource;
    });
  }, [search, selectedSource]);

  const sections = useMemo(() => groupBySource(filtered), [filtered]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 90;

  const jumpToSource = (src: string) => {
    setSelectedSource(src === selectedSource ? null : src);
    const idx = sections.findIndex((s) => s.title === src);
    if (idx >= 0) {
      sectionListRef.current?.scrollToLocation({
        sectionIndex: idx,
        itemIndex: 0,
        animated: true,
        viewOffset: 0,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed top bar: search + source pills */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Search bar */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search slokas…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Source-text quick-jump pills */}
        <FlatList
          horizontal
          data={["All", ...sourceTexts]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          style={styles.pills}
          contentContainerStyle={styles.pillsContent}
          renderItem={({ item }) => {
            const active =
              item === "All" ? !selectedSource : selectedSource === item;
            return (
              <TouchableOpacity
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  if (item === "All") {
                    setSelectedSource(null);
                  } else {
                    jumpToSource(item);
                  }
                }}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: active
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              {
                backgroundColor: colors.navyDeep,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: colors.primary }]}
              numberOfLines={1}
            >
              {section.title}
            </Text>
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                {section.data.length}{" "}
                {section.data.length === 1 ? "sloka" : "slokas"}
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => <SlokaCard sloka={item} />}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No slokas found
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Try a different search
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "GentiumBookPlus_400Regular",
    padding: 0,
  },
  pills: {},
  pillsContent: {
    gap: 8,
    paddingRight: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 160,
  },
  pillText: {
    fontSize: 13,
    fontFamily: "GentiumBookPlus_400Regular",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: "GentiumBookPlus_700Bold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontFamily: "GentiumBookPlus_400Regular",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "GentiumBookPlus_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "GentiumBookPlus_400Regular",
  },
});
