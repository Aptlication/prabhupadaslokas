/**
 * Themed scaffold shared by every auth screen: paper/night background, centered
 * column, the app's AuthHeader logo block, and keyboard-aware scrolling.
 */
import React from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthHeader } from "@/components/AuthHeader";
import { useColors } from "@/hooks/useColors";

export function AuthScreen({
  children,
  tagline,
}: {
  children: React.ReactNode;
  tagline?: string;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const Scroller: any =
    Platform.OS === "web" ? ScrollView : KeyboardAwareScrollView;

  return (
    <Scroller
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 40 },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.column}>
        <AuthHeader tagline={tagline} />
        {children}
      </View>
    </Scroller>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 },
  column: { width: "100%", maxWidth: 420, alignSelf: "center" },
});
