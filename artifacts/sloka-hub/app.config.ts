import { ExpoConfig, ConfigContext } from "expo/config";

const APP_NAME = "Prabhupada Slokas";
const APP_TAGLINE = "Chant it. Know it. Speak with authority.";
const APP_DESCRIPTION =
  "Prabhupada Slokas helps ISKCON devotees learn slokas, improve pronunciation, understand meanings, and memorize them effectively through structured practice.";
const APP_VERSION = "1.0.0";

// Public origin used by expo-router for typed routes / deep linking.
// In dev this falls back to localhost; in production it should be the
// canonical PWA URL.
const PROD_ORIGIN = "https://prabhupadaslokas.com";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: "sloka-hub",
  version: APP_VERSION,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "sloka-hub",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#F7F5F0",
  },
  ios: {
    supportsTablet: false,
  },
  android: {},
  web: {
    favicon: "./assets/images/icon.png",
    backgroundColor: "#F7F5F0",
    themeColor: "#8A3A2E",
    description: `${APP_DESCRIPTION} ${APP_TAGLINE}`,
    lang: "en",
    name: APP_NAME,
    shortName: APP_NAME,
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    startUrl: "/",
  },
  plugins: [
    [
      "expo-router",
      {
        origin: PROD_ORIGIN,
      },
    ],
    "expo-font",
    "expo-web-browser",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
