import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";

import colors from "@/constants/colors";

const nativeDriver = Platform.OS !== "web";

export function LoadingScreen() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: nativeDriver,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: nativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: nativeDriver,
        }),
      ])
    ).start();
  }, [spin, pulse]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.om}>ॐ</Text>
      </Animated.View>

      <Animated.View style={[styles.spinnerRing, { transform: [{ rotate }] }]} />

      <Text style={styles.label}>Prabhupada Slokas</Text>
    </View>
  );
}

const C = colors.light;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.navyDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
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
  },
  om: {
    fontSize: 38,
    color: C.primary,
    lineHeight: 46,
  },
  spinnerRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: C.saffron,
    borderRightColor: C.primary,
  },
  label: {
    marginTop: 20,
    fontSize: 15,
    color: C.mutedForeground,
    letterSpacing: 1,
    fontFamily: "Inter_500Medium",
  },
});
