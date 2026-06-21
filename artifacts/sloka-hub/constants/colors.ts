/**
 * Color palette — soft "paper" reading theme.
 *
 * Styled to feel like a printed Kindle / Bhaktivedanta book without a strong
 * colour cast:
 *  - `light` = a faint off-white page (barely warm) with near-black ink + maroon accents.
 *  - `dark`  = its reverse — a faint off-black with off-white ink + amber accents.
 *
 * The active palette is chosen by the in-app theme toggle (see AppContext /
 * useColors), NOT the device appearance setting. All historical token keys
 * (navyDeep, saffron, goldLight, etc.) are preserved and remapped to the new
 * scheme so existing components keep working without edits.
 */
const colors = {
  // ── Paper (default) ──────────────────────────────────────────────
  light: {
    text: "#2B2A28",
    tint: "#8A3A2E",

    background: "#F7F5F0", // slightly off-white
    foreground: "#2B2A28", // near-black ink

    card: "#FFFFFF", // a clean page
    cardForeground: "#2B2A28",

    primary: "#8A3A2E", // muted maroon
    primaryForeground: "#FFFFFF",

    secondary: "#ECE9E1",
    secondaryForeground: "#2B2A28",

    muted: "#EEEBE3",
    mutedForeground: "#6B6A66",

    accent: "#8A3A2E",
    accentForeground: "#FFFFFF",

    destructive: "#B23A2E",
    destructiveForeground: "#FFFFFF",

    border: "#E3E0D8",
    input: "#E3E0D8",

    // App-specific (remapped onto the off-white scheme)
    goldLight: "#B6852F",
    goldDark: "#8A5E1E",
    navyLight: "#F0EDE6", // tab bar / panels
    navyMid: "#F3F0E9",
    navyDeep: "#F7F5F0", // splash / loading background
    saffron: "#C5601F",
    learned: "#4E7A3A",
    learning: "#B6852F",
    unstarted: "#A9A7A0",
  },

  // ── Night (reverse) ──────────────────────────────────────────────
  dark: {
    text: "#ECEAE4",
    tint: "#D9A14C",

    background: "#181715", // slightly off-black
    foreground: "#ECEAE4", // off-white ink

    card: "#211F1C",
    cardForeground: "#ECEAE4",

    primary: "#D9A14C", // warm amber
    primaryForeground: "#181715",

    secondary: "#2C2A26",
    secondaryForeground: "#ECEAE4",

    muted: "#26241F",
    mutedForeground: "#9C9A93",

    accent: "#D9A14C",
    accentForeground: "#181715",

    destructive: "#E0695A",
    destructiveForeground: "#181715",

    border: "#34322E",
    input: "#34322E",

    // App-specific
    goldLight: "#E6C06A",
    goldDark: "#B08A3C",
    navyLight: "#201E1B",
    navyMid: "#211F1C",
    navyDeep: "#181715",
    saffron: "#E08A3A",
    learned: "#7FB36A",
    learning: "#D9A14C",
    unstarted: "#6F6D66",
  },

  radius: 12,
};

export default colors;
