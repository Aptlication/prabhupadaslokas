import React, { useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";

import { WordMeaning } from "@/data/slokas";
import { useColors } from "@/hooks/useColors";

interface WordChipProps {
  item: WordMeaning;
  index: number;
}

export function WordChip({ item, index }: WordChipProps) {
  const colors = useColors();
  const [revealed, setRevealed] = useState(false);
  const [scale] = useState(new Animated.Value(1));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    setRevealed((prev) => !prev);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.chip,
          {
            backgroundColor: revealed ? colors.primary : colors.card,
            borderColor: revealed ? colors.primary : colors.border,
          },
        ]}
        testID={`word-chip-${index}`}
      >
        <Text
          style={[
            styles.word,
            { color: revealed ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {item.word}
        </Text>
        {revealed && (
          <Text
            style={[
              styles.meaning,
              { color: revealed ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            {item.meaning}
          </Text>
        )}
        {!revealed && (
          <Text style={[styles.tap, { color: colors.mutedForeground }]}>tap</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: "center",
    gap: 2,
  },
  word: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    fontStyle: "italic",
  },
  meaning: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  tap: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },
});
