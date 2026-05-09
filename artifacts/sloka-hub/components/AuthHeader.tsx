import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";

const C = colors.light;

interface AuthHeaderProps {
  tagline?: string;
}

export function AuthHeader({ tagline = "Learn it. Live it. Lead it." }: AuthHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <Image
        source={require("../assets/images/icon.png")}
        style={styles.logo}
        resizeMode="cover"
      />
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
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.primary,
    marginBottom: 14,
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
