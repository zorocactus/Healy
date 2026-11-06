// ─── Shared theme tokens for the Admin Dashboard ──────────────────────────────
// IMPORTANT: This file is pure JS (no JSX). Keep it that way.
export const T = {
  light: {
    bg: "#F0F4F8", card: "#ffffff", nav: "#ffffff", sidebar: "#ffffff",
    border: "#E4EAF5", txt: "#0D1B2E", txt2: "#5A6E8A", txt3: "#9AACBE",
    blue: "#4A6FA5", blueLight: "#EEF3FB", green: "#2D8C6F", greenLight: "#EEF8F4",
    amber: "#E8A838", amberLight: "#FFF8EC", red: "#E05555", redLight: "#FFF0F0",
    purple: "#7B5EA7", purpleLight: "#F3EEFF",
  },
  dark: {
    bg: "#080D14", card: "#0F1824", nav: "#0F1824", sidebar: "#0A1220",
    border: "rgba(99,142,203,0.12)", txt: "#E8F0FA", txt2: "#7A9CC8", txt3: "#3A5070",
    blue: "#5A87C5", blueLight: "#111E30", green: "#3AAA80", greenLight: "#0F2820",
    amber: "#E8A838", amberLight: "#1E1500", red: "#E05555", redLight: "#1E0A0A",
    purple: "#9B7FD4", purpleLight: "#1A1030",
  },
};

export const ROLE_META = {
  patient:        { color: "#4A6FA5", bg: "#EEF3FB" },
  doctor:         { color: "#2D8C6F", bg: "#EEF8F4" },
  "médecin":      { color: "#2D8C6F", bg: "#EEF8F4" },
  pharmacist:     { color: "#E8A838", bg: "#FFF8EC" },
  "pharmacien":   { color: "#E8A838", bg: "#FFF8EC" },
  caretaker:      { color: "#7B5EA7", bg: "#F3EEFF" },
  "garde-malade": { color: "#7B5EA7", bg: "#F3EEFF" },
  admin:          { color: "#E05555", bg: "#FFF0F0" },
};

// ─── HMS Professional dark tokens ────────────────────────────────────────────
// Used by the HMS-style views (always dark, matching the Kinda HMS screenshot)
export const HMS = {
  bg:        "#0F1117",
  surface:   "#1A1D2E",
  card:      "#1E2235",
  cardHover: "#232840",
  border:    "rgba(255,255,255,0.06)",
  row:       "rgba(255,255,255,0.025)",
  header:    "rgba(255,255,255,0.015)",
  txt:       "#E8EAED",
  txt2:      "#9AA3B0",
  txt3:      "#5C6370",
  blue:      "#5B7FFF",
  blueHover: "#6B8FFF",
  blueFaint: "rgba(91,127,255,0.08)",
  blueLight: "rgba(91,127,255,0.06)",
  green:     "#22C55E",
  greenBg:   "rgba(34,197,94,0.12)",
  red:       "#EF4444",
  redBg:     "rgba(239,68,68,0.12)",
  amber:     "#F59E0B",
  amberBg:   "rgba(245,158,11,0.12)",
  purple:    "#A78BFA",
  purpleBg:  "rgba(167,139,250,0.12)",
};

// NOTE: icons (Lucide components) are NOT included here to keep this file pure JS.
// The icon mapping lives in Admindashboard.jsx's local LOG_COLORS constant.
export const LOG_COLORS = {
  success: { color: "#2D8C6F", bg: "#EEF8F4", bgDk: "#0F2820" },
  warning: { color: "#E8A838", bg: "#FFF8EC", bgDk: "#1E1500" },
  danger:  { color: "#E05555", bg: "#FFF0F0", bgDk: "#1E0A0A" },
  info:    { color: "#4A6FA5", bg: "#EEF3FB", bgDk: "#111E30" },
};

// ─── HMS Light — tokens light compatibles avec les clés HMS ──────────────────
// Même clés qu'HMS (bg, surface, card, border, row, header, txt*, blue*, …)
// Utilisé par getAdminTheme pour les vues PEOPLE en mode clair.
const HMS_LIGHT = {
  bg:        "#F0F4F8",
  surface:   "#FFFFFF",
  card:      "#FFFFFF",
  cardHover: "#F8FAFC",
  border:    "#E4EAF5",
  row:       "rgba(74,111,165,0.04)",
  header:    "rgba(74,111,165,0.025)",
  txt:       "#0D1B2E",
  txt2:      "#5A6E8A",
  txt3:      "#9AACBE",
  blue:      "#4A6FA5",
  blueHover: "#3D5F8F",
  blueFaint: "rgba(74,111,165,0.08)",
  blueLight: "#EEF3FB",
  green:     "#2D8C6F",
  greenBg:   "#EEF8F4",
  red:       "#E05555",
  redBg:     "#FFF0F0",
  amber:     "#E8A838",
  amberBg:   "#FFF8EC",
  purple:    "#7B5EA7",
  purpleBg:  "#F3EEFF",
};

/**
 * getAdminTheme(dk)
 * Retourne HMS (dark) si dk=true, HMS_LIGHT (light) si dk=false.
 * À utiliser dans toutes les vues PEOPLE pour être theme-aware.
 * @param {boolean} dk
 * @returns {object} theme tokens
 */
export function getAdminTheme(dk) {
  return dk ? HMS : HMS_LIGHT;
}

