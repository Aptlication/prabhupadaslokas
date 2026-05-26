import { ExpoConfig, ConfigContext } from "expo/config";

const APP_NAME = "Prabhupada Slokas";
const APP_TAGLINE = "Learn it. Live it. Lead it.";
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
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#0D1B3E",
  },
  ios: {
    supportsTablet: false,
  },
  android: {},
  web: {
    favicon: "./assets/images/icon.png",
    backgroundColor: "#0D1B3E",
    themeColor: "#C9A84C",
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
