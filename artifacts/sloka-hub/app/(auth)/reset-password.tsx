/**
 * Reset password — the one place email-code is retained, now as recovery only.
 * Flow: email -> emailed code + new password -> signed in. Uses Clerk's
 * reset_password_email_code first factor.
 */
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { clerkErrorMessage } from "@/components/auth/clerkError";
import {
  AuthField,
  FormError,
  LinkText,
  PrimaryButton,
} from "@/components/auth/ui";
import { useColors } from "@/hooks/useColors";

export default function ResetPasswordScreen() {
  const c = useColors();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [stage, setStage] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onRequestCode = async () => {
    if (!isLoaded) return;
    setError(null);
    if (!email.trim()) {
      setError("Enter the email on your account.");
      return;
    }
    setLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });
      setStage("reset");
    } catch (e) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onReset = async () => {
    if (!isLoaded) return;
    setError(null);
    if (!code.trim() || password.length < 8) {
      setError("Enter the code and a new password (8+ characters).");
      return;
    }
    setLoading(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password,
      });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
      } else {
        setError("Couldn't reset the password. Try again.");
      }
    } catch (e) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen tagline="Reset your password">
      <Text style={[styles.heading, { color: c.foreground }]}>
        {stage === "request" ? "Forgot password" : "Choose a new password"}
      </Text>

      <FormError message={error} />

      {stage === "request" ? (
        <>
          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="you@example.com"
            onSubmitEditing={onRequestCode}
          />
          <PrimaryButton
            label="Email me a code"
            onPress={onRequestCode}
            loading={loading}
          />
        </>
      ) : (
        <>
          <Text style={[styles.helpText, { color: c.mutedForeground }]}>
            Enter the code sent to {email} and a new password.
          </Text>
          <AuthField
            label="Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            placeholder="123456"
          />
          <AuthField
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            onSubmitEditing={onReset}
          />
          <PrimaryButton
            label="Reset password"
            onPress={onReset}
            loading={loading}
          />
        </>
      )}

      <View style={styles.footerRow}>
        <LinkText
          label="Back to sign in"
          onPress={() => router.replace("/(auth)/sign-in")}
        />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontFamily: "GentiumBookPlus_700Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  helpText: {
    fontSize: 14,
    fontFamily: "GentiumBookPlus_400Regular",
    textAlign: "center",
    marginBottom: 18,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
});
