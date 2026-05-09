import React from "react";
import { StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";

const C = colors.light;

interface AuthHeaderProps {
  tagline?: string;
}

export function AuthHeader({ tagline = "Learn it. Live it. Lead it." }: AuthHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.logoWrap}>
        <Text style={styles.om}>ॐ</Text>
      </View>
      <Text style={styles.appName}>Prabhupada Slokas</Text>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.navyMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.primary,
    marginBottom: 14,
  },
  om: {
    fontSize: 38,
    color: C.primary,
    lineHeight: 46,
  },
  appName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.mutedForeground,
    fontStyle: "italic",
  },
});
