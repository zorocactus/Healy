// ─── Shared theme tokens for non-admin dashboards ────────────────────────────
// Source de vérité unique pour Patient / Doctor / Pharmacist / Caretaker.
// (AdminDashboard utilise son propre fichier `pages/admin/adminTheme.js`
//  qui inclut des clés additionnelles : sidebar, *Light, HMS, ROLE_META.)
//
// Usage :
//   import { T, useDashColors } from "../_shared/theme";
//   const c = useDashColors(dk);   // ou : const c = dk ? T.dark : T.light;

export const T = {
  light: {
    bg:        "#F0F4F8",
    card:      "#ffffff",
    nav:       "#ffffff",
    border:    "#E4EAF5",
    txt:       "#0D1B2E",
    txt2:      "#5A6E8A",
    txt3:      "#9AACBE",
    blue:      "#4A6FA5",
    blueLight: "#EEF3FB",
    green:     "#2D8C6F",
    amber:     "#E8A838",
    red:       "#E05555",
    purple:    "#7B5EA7",
    navHover:  "#EEF3FB",
  },
  dark: {
    bg:        "#0D1117",
    card:      "#141B27",
    nav:       "#141B27",
    border:    "rgba(99,142,203,0.15)",
    txt:       "#F0F3FA",
    txt2:      "#8AAEE0",
    txt3:      "#4A6080",
    blue:      "#638ECB",
    blueLight: "#1A2333",
    green:     "#4CAF82",
    amber:     "#F0A500",
    red:       "#E05555",
    purple:    "#9B7FD4",
    navHover:  "#1A2333",
  },
};

/** Petit helper pour récupérer la palette en fonction du flag dk. */
export function useDashColors(dk) {
  return dk ? T.dark : T.light;
}
