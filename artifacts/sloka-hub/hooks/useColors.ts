import colors from "@/constants/colors";
import { useThemePreference } from "@/context/AppContext";

/**
 * Returns the design tokens for the active reading theme.
 *
 * The palette is driven by the in-app theme toggle (paper / night) stored in
 * AppContext — NOT the device appearance setting — so the chosen look is
 * consistent across platforms and persists across launches.
 *
 *   theme "paper" -> colors.light  (aged-paper default)
 *   theme "night" -> colors.dark   (warm dark sepia)
 *
 * The returned object also includes scheme-independent values like `radius`.
 */
export function useColors() {
  const { theme } = useThemePreference();
  const palette = theme === "night" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
