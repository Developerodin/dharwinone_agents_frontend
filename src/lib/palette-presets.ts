/** Curated palette presets — 0 tokens, instant restyle via CSS vars. */
export interface PalettePreset {
  id: string;
  label: string;
  primary: string;
  accent: string;
  neutral: string;
  bg: string;
  surface: string;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: "navy_gold",
    label: "Navy & Gold",
    primary: "#1E40AF",
    accent: "#F59E0B",
    neutral: "#0F172A",
    bg: "#F8FAFC",
    surface: "#E2E8F0",
  },
  {
    id: "slate_amber",
    label: "Slate & Amber",
    primary: "#334155",
    accent: "#FBBF24",
    neutral: "#111827",
    bg: "#F9FAFB",
    surface: "#E5E7EB",
  },
  {
    id: "forest_cream",
    label: "Forest & Cream",
    primary: "#166534",
    accent: "#FDE68A",
    neutral: "#1C1917",
    bg: "#FAFAF9",
    surface: "#E7E5E4",
  },
  {
    id: "crimson_paper",
    label: "Crimson & Paper",
    primary: "#C8102E",
    accent: "#C8102E",
    neutral: "#242E3A",
    bg: "#F6F9FB",
    surface: "#E9EEF3",
  },
  {
    id: "teal_coral",
    label: "Teal & Coral",
    primary: "#0D9488",
    accent: "#FB7185",
    neutral: "#134E4A",
    bg: "#F0FDFA",
    surface: "#CCFBF1",
  },
  {
    id: "indigo_rose",
    label: "Indigo & Rose",
    primary: "#4338CA",
    accent: "#F472B6",
    neutral: "#1E1B4B",
    bg: "#EEF2FF",
    surface: "#C7D2FE",
  },
  {
    id: "charcoal_lime",
    label: "Charcoal & Lime",
    primary: "#27272A",
    accent: "#A3E635",
    neutral: "#18181B",
    bg: "#FAFAFA",
    surface: "#E4E4E7",
  },
  {
    id: "burgundy_sand",
    label: "Burgundy & Sand",
    primary: "#7F1D1D",
    accent: "#D6C6A8",
    neutral: "#292524",
    bg: "#FAF7F2",
    surface: "#EDE8DF",
  },
  {
    id: "ocean_sky",
    label: "Ocean & Sky",
    primary: "#0369A1",
    accent: "#38BDF8",
    neutral: "#0C4A6E",
    bg: "#F0F9FF",
    surface: "#BAE6FD",
  },
  {
    id: "plum_peach",
    label: "Plum & Peach",
    primary: "#6B21A8",
    accent: "#FDBA74",
    neutral: "#3B0764",
    bg: "#FAF5FF",
    surface: "#E9D5FF",
  },
  {
    id: "midnight_copper",
    label: "Midnight & Copper",
    primary: "#0F172A",
    accent: "#B45309",
    neutral: "#020617",
    bg: "#F1F5F9",
    surface: "#CBD5E1",
  },
  {
    id: "sage_stone",
    label: "Sage & Stone",
    primary: "#4D7C0F",
    accent: "#78716C",
    neutral: "#365314",
    bg: "#F7FEE7",
    surface: "#D9F99D",
  },
];

export function getPalettePreset(id: string): PalettePreset | undefined {
  return PALETTE_PRESETS.find((p) => p.id === id);
}
