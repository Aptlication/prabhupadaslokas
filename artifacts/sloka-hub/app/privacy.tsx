import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_NAME } from "@/constants/app";
import { useColors } from "@/hooks/useColors";

const EFFECTIVE_DATE = "25 July 2026";
const CONTACT_EMAIL = "jonathanekandrews@gmail.com";

/**
 * Privacy Policy — served at /privacy on web (linked from Settings → About)
 * and reachable in the native app the same way.
 *
 * Two distinct surfaces are covered:
 *   1. The iOS app — fully local, collects no data at all.
 *   2. The website (prabhupadaslokas.com) — identical experience, with an
 *      OPTIONAL email one-time-code sign-in used solely to sync progress.
 */
export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;
  const bottomPad = Platform.OS === "web" ? 48 : insets.bottom + 32;

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const P = ({ children }: { children: React.ReactNode }) => (
    <Text style={[styles.body, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/");
          }}
          style={styles.backBtn}
          testID="privacy-back-btn"
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Privacy Policy
        </Text>
      </View>

      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {APP_NAME} — effective {EFFECTIVE_DATE}
      </Text>

      <Section title="Summary">
        <P>
          {APP_NAME} is a devotional study tool. The mobile app collects no
          personal data at all. The website offers an optional email sign-in
          used only to back up your learning progress. There are no ads, no
          analytics trackers, and your information is never sold or shared.
        </P>
      </Section>

      <Section title="The mobile app: no data collected">
        <P>
          The iOS app does not collect, transmit, or store any personal
          information. Your learning progress — slokas marked as learning,
          learnt, or saved, and your theme preference — is stored only on your
          device. It never leaves your device, and we cannot see it. No
          account is required or offered in the app. If you delete the app,
          that data is deleted with it.
        </P>
      </Section>

      <Section title="The website: optional sign-in">
        <P>
          At prabhupadaslokas.com you can use the site without signing in, in
          which case progress is kept only in your browser. If you choose to
          sign in, we ask for your email address and send a one-time code to
          verify it. Your email is used solely to identify your account and
          deliver that code — never for marketing.
        </P>
        <P>
          When signed in, your learning progress is stored against your
          account so it can follow you between browsers. That is the only
          information we keep: your email address and your sloka progress.
        </P>
      </Section>

      <Section title="What we do not do">
        <P>
          We do not use advertising or analytics SDKs. We do not track you
          across apps or websites. We do not sell, rent, or share personal
          information with third parties. We do not knowingly collect
          information from children.
        </P>
      </Section>

      <Section title="Service providers">
        <P>
          The website is hosted on Cloudflare, and sign-in codes are delivered
          through Cloudflare's access service. These providers process data
          only as needed to operate the site.
        </P>
      </Section>

      <Section title="Your choices">
        <P>
          You can use the app and website entirely without an account. To
          delete website account data (your email and synced progress),
          contact us at the address below and we will remove it.
        </P>
      </Section>

      <Section title="Changes and contact">
        <P>
          If this policy changes, the updated version will be posted here with
          a new effective date. Questions or requests: {CONTACT_EMAIL}
        </P>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  backBtn: { padding: 6, marginLeft: -6 },
  title: {
    fontSize: 24,
    fontFamily: "GentiumBookPlus_700Bold",
  },
  meta: {
    fontSize: 13,
    fontFamily: "GentiumBookPlus_400Regular_Italic",
    marginBottom: 16,
    marginLeft: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "GentiumBookPlus_700Bold",
  },
  body: {
    fontSize: 14,
    fontFamily: "GentiumBookPlus_400Regular",
    lineHeight: 21,
  },
});
