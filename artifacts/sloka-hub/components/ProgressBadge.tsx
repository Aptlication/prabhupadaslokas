import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";

import { ProgressStatus } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface ProgressBadgeProps {
  status: ProgressStatus;
  onPress: (status: ProgressStatus) => void;
}

const OPTIONS: { label: string; value: ProgressStatus }[] = [
  { label: "Not Started", value: "unstarted" },
  { label: "Learning", value: "learning" },
  { label: "Learned", value: "learned" },
];

export function ProgressSelector({ status, onPress }: ProgressBadgeProps) {
  const colors = useColors();

  const getColor = (val: ProgressStatus) => {
    if (val === "learned") return colors.learned;
    if (val === "learning") return colors.learning;
    return colors.unstarted;
  };

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = status === opt.value;
        const col = getColor(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.pill,
              {
                backgroundColor: active ? col + "22" : colors.card,
                borderColor: active ? col : colors.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress(opt.value);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.dot, { backgroundColor: col, opacity: active ? 1 : 0.4 }]} />
            <Text
              style={[
                styles.label,
                { color: active ? col : colors.mutedForeground, fontFamily: active ? "GentiumBookPlus_700Bold" : "GentiumBookPlus_400Regular" },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
  },
});
