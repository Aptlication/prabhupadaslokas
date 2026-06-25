/**
 * Sign up — email + password + display name, then a one-time email code to
 * verify the address (Clerk requires a verified email before the account is
 * active). Google sign-up is offered as a shortcut.
 */
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { clerkErrorMessage } from "@/components/auth/clerkError";
import { useGoogleAuth } from "@/components/auth/useGoogleAuth";
import {
  AuthField,
  FormError,
  LinkText,
  OrDivider,
  PrimaryButton,
  SocialButton,
} from "@/components/auth/ui";
import { useColors } from "@/hooks/useColors";

export default function SignUpScreen() {
  const c = useColors();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const google = useGoogleAuth();

  const [stage, setStage] = useState<"details" | "verify">("details");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmitDetails = async () => {
    if (!isLoaded) return;
    setError(null);
    if (!email.trim() || password.length < 8) {
      setError("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        ...(displayName.trim() ? { firstName: displayName.trim() } : {}),
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStage("verify");
    } catch (e) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!isLoaded) return;
    setError(null);
    if (!code.trim()) {
      setError("Enter the code we emailed you.");
      return;
    }
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
      } else {
        setError("That code didn't work. Request a new one and try again.");
      }
    } catch (e) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <Text style={[styles.heading, { color: c.foreground }]}>
        {stage === "details" ? "Create your account" : "Verify your email"}
      </Text>

      <FormError message={error ?? google.error} />

      {stage === "details" ? (
        <>
          <AuthField
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            placeholder="How we greet you (optional)"
          />
          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <AuthField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
          <PrimaryButton
            label="Continue"
            onPress={onSubmitDetails}
            loading={loading}
          />

          <OrDivider />
          <SocialButton
            label="Continue with Google"
            onPress={google.signInWithGoogle}
            loading={google.loading}
          />

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: c.mutedForeground }]}>
              Already have an account?{" "}
            </Text>
            <LinkText
              label="Sign in"
              onPress={() => router.replace("/(auth)/sign-in")}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.helpText, { color: c.mutedForeground }]}>
            We sent a 6-digit code to {email}. Enter it below to finish.
          </Text>
          <AuthField
            label="Verification code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            placeholder="123456"
            onSubmitEditing={onVerify}
          />
          <PrimaryButton
            label="Verify & continue"
            onPress={onVerify}
            loading={loading}
          />
          <View style={[styles.footerRow, { marginTop: 18 }]}>
            <LinkText
              label="Use a different email"
              onPress={() => {
                setStage("details");
                setCode("");
                setError(null);
              }}
            />
          </View>
        </>
      )}
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
  footerText: { fontSize: 14, fontFamily: "GentiumBookPlus_400Regular" },
});
