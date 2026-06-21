import { Feather } from "@expo/vector-icons";
import React from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SlokaCard } from "@/components/SlokaCard";
import { useApp } from "@/context/AppContext";
import { slokas } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

export default function MySlokas() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isMySlokas } = useApp();

  const saved = slokas.filter((s) => isMySlokas(s.id));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 90;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>My Slokas</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {saved.length} {saved.length === 1 ? "sloka" : "slokas"} saved
        </Text>
      </View>

      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SlokaCard sloka={item} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}
        scrollEnabled={!!saved.length}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bookmark" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No slokas saved yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Browse slokas and bookmark the ones you want to practice
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
