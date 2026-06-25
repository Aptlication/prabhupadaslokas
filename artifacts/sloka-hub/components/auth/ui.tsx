/**
 * Shared presentational primitives for the auth screens. Themed via useColors
 * so they track the paper/night toggle, and they reuse the existing Gentium
 * type scale for visual consistency with the rest of the app.
 */
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

export function AuthField({
  label,
  errorText,
  ...inputProps
}: { label: string; errorText?: string } & TextInputProps) {
  const c = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: c.card,
            borderColor: errorText ? c.destructive : c.border,
            color: c.foreground,
          },
        ]}
        {...inputProps}
      />
      {errorText ? (
        <Text style={[styles.errorText, { color: c.destructive }]}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.primaryBtn,
        { backgroundColor: c.primary, opacity: isDisabled ? 0.6 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.primaryForeground} />
      ) : (
        <Text style={[styles.primaryBtnText, { color: c.primaryForeground }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function OrDivider() {
  const c = useColors();
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
      <Text style={[styles.dividerText, { color: c.mutedForeground }]}>or</Text>
      <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
    </View>
  );
}

export function SocialButton({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[
        styles.socialBtn,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.foreground} />
      ) : (
        <Text style={[styles.socialBtnText, { color: c.foreground }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function FormError({ message }: { message?: string | null }) {
  const c = useColors();
  if (!message) return null;
  return (
    <View
      style={[
        styles.formError,
        { backgroundColor: c.muted, borderColor: c.destructive },
      ]}
    >
      <Text style={[styles.formErrorText, { color: c.destructive }]}>
        {message}
      </Text>
    </View>
  );
}

export function LinkText({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={[styles.linkText, { color: c.primary }]}>{label}</Text>
    </Pressable>
  );
}

const serif = "GentiumBookPlus_400Regular";
const serifBold = "GentiumBookPlus_700Bold";

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontFamily: serif,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
    fontSize: 16,
    fontFamily: serif,
  },
  errorText: { fontSize: 12, fontFamily: serif, marginTop: 5 },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 16, fontFamily: serifBold },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontFamily: serif },
  socialBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  socialBtnText: { fontSize: 15, fontFamily: serifBold },
  formError: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  formErrorText: { fontSize: 13, fontFamily: serif },
  linkText: { fontSize: 14, fontFamily: serifBold },
});
