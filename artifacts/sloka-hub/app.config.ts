import { ExpoConfig, ConfigContext } from "expo/config";
import {
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
  APP_VERSION,
} from "./constants/app";

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
        origin: "https://replit.com/",
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
