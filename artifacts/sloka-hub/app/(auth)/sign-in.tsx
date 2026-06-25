/**
 * Sign in — email + password (primary) with a "Continue with Google" option
 * and links to sign-up and password reset.
 */
import { useSignIn } from "@clerk/clerk-expo";
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

export default function SignInScreen() {
  const c = useColors();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const google = useGoogleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    if (!isLoaded) return;
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        // Root layout reacts to the new session and shows the app.
      } else {
        setError("Additional verification required. Check your email.");
      }
    } catch (e) {
      setError(clerkErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <Text style={[styles.heading, { color: c.foreground }]}>Welcome back</Text>

      <FormError message={error ?? google.error} />

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
        textContentType="password"
        autoComplete="current-password"
        placeholder="Your password"
        onSubmitEditing={onSignIn}
        returnKeyType="go"
      />

      <View style={styles.forgotRow}>
        <LinkText
          label="Forgot password?"
          onPress={() => router.push("/(auth)/reset-password")}
        />
      </View>

      <PrimaryButton label="Sign in" onPress={onSignIn} loading={loading} />

      <OrDivider />
      <SocialButton
        label="Continue with Google"
        onPress={google.signInWithGoogle}
        loading={google.loading}
      />

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: c.mutedForeground }]}>
          New here?{" "}
        </Text>
        <LinkText
          label="Create an account"
          onPress={() => router.replace("/(auth)/sign-up")}
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
  forgotRow: { alignItems: "flex-end", marginBottom: 16 },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  footerText: { fontSize: 14, fontFamily: "GentiumBookPlus_400Regular" },
});
