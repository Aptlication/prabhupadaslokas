/**
 * Clerk token cache.
 *
 * Clerk needs somewhere to persist the session JWT between launches. On native
 * we use the OS keychain via expo-secure-store; on web the browser manages the
 * Clerk session cookie itself, so the cache is a no-op there (returning
 * `undefined` tells Clerk to fall back to its web storage).
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Structural type matching what ClerkProvider's `tokenCache` prop expects.
 * Declared locally rather than deep-imported from Clerk internals so it stays
 * stable across SDK versions.
 */
interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void | Promise<void>;
}

const createTokenCache = (): TokenCache => ({
  getToken: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // A corrupt/locked keychain entry shouldn't crash auth — drop it.
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        /* noop */
      }
      return null;
    }
  },
  saveToken: (key: string, token: string) =>
    SecureStore.setItemAsync(key, token),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
});

// On web Clerk uses its own cookie/storage; only provide a cache on native.
export const tokenCache =
  Platform.OS === "web" ? undefined : createTokenCache();
