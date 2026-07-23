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
    label: "Royal Navy",
    primary: "#1E40AF",
    accent: "#F59E0B",
    neutral: "#0F172A",
    bg: "#E2EAF4",
    surface: "#C7D6E8",
  },
  {
    id: "slate_amber",
    label: "Urban Slate",
    primary: "#334155",
    accent: "#FBBF24",
    neutral: "#111827",
    bg: "#EDEAE4",
    surface: "#D6D2CA",
  },
  {
    id: "forest_cream",
    label: "Evergreen Cream",
    primary: "#166534",
    accent: "#FDE68A",
    neutral: "#1C1917",
    bg: "#F0EBD8",
    surface: "#E0D8C0",
  },
  {
    id: "crimson_paper",
    label: "Editorial Crimson",
    primary: "#C8102E",
    accent: "#E8A317",
    neutral: "#242E3A",
    bg: "#FAF0F0",
    surface: "#F0DEDE",
  },
  {
    id: "teal_coral",
    label: "Reef Teal",
    primary: "#0D9488",
    accent: "#FB7185",
    neutral: "#134E4A",
    bg: "#E0F5F0",
    surface: "#B8EDE4",
  },
  {
    id: "indigo_rose",
    label: "Twilight Indigo",
    primary: "#4338CA",
    accent: "#F472B6",
    neutral: "#1E1B4B",
    bg: "#E4E8FA",
    surface: "#C7D2FE",
  },
  {
    id: "charcoal_lime",
    label: "Neon Charcoal",
    primary: "#27272A",
    accent: "#A3E635",
    neutral: "#18181B",
    bg: "#E8E8EA",
    surface: "#D4D4D8",
  },
  {
    id: "burgundy_sand",
    label: "Vintage Burgundy",
    primary: "#7F1D1D",
    accent: "#D6C6A8",
    neutral: "#292524",
    bg: "#F3EBDC",
    surface: "#E5D9C8",
  },
  {
    id: "ocean_sky",
    label: "Coastal Sky",
    primary: "#0369A1",
    accent: "#38BDF8",
    neutral: "#0C4A6E",
    bg: "#DCEEF8",
    surface: "#BAE6FD",
  },
  {
    id: "plum_peach",
    label: "Orchard Plum",
    primary: "#6B21A8",
    accent: "#FDBA74",
    neutral: "#3B0764",
    bg: "#F0E6FA",
    surface: "#E9D5FF",
  },
  {
    id: "midnight_copper",
    label: "Midnight Copper",
    primary: "#0F172A",
    accent: "#B45309",
    neutral: "#020617",
    bg: "#E8DFD4",
    surface: "#D4C8B8",
  },
  {
    id: "sage_stone",
    label: "Sage Meadow",
    primary: "#4D7C0F",
    accent: "#78716C",
    neutral: "#365314",
    bg: "#E5F0D8",
    surface: "#C8DEB0",
  },
  {
    id: "terracotta_clay",
    label: "Terracotta Clay",
    primary: "#B45309",
    accent: "#D97706",
    neutral: "#431407",
    bg: "#F4E4D4",
    surface: "#E8CEB4",
  },
  {
    id: "arctic_frost",
    label: "Arctic Frost",
    primary: "#0284C7",
    accent: "#7DD3FC",
    neutral: "#0C4A6E",
    bg: "#E3EFF5",
    surface: "#C8E0ED",
  },
  {
    id: "espresso_cream",
    label: "Espresso Cream",
    primary: "#78350F",
    accent: "#CA8A04",
    neutral: "#292018",
    bg: "#EDE4D6",
    surface: "#D9CCBA",
  },
  {
    id: "rose_blush",
    label: "Rose Blush",
    primary: "#BE185D",
    accent: "#FDA4AF",
    neutral: "#500724",
    bg: "#FAE8EC",
    surface: "#F5D0D8",
  },
  {
    id: "storm_gray",
    label: "Storm Gray",
    primary: "#475569",
    accent: "#94A3B8",
    neutral: "#1E293B",
    bg: "#E0E4EA",
    surface: "#CBD2DC",
  },
  {
    id: "golden_hour",
    label: "Golden Hour",
    primary: "#B45309",
    accent: "#FACC15",
    neutral: "#422006",
    bg: "#F8EDD8",
    surface: "#EDD9B0",
  },
  {
    id: "obsidian_gold",
    label: "Obsidian Gold",
    primary: "#D4AF37",
    accent: "#E8C547",
    neutral: "#F5F3EF",
    bg: "#1C1C22",
    surface: "#2A2A32",
  },
  {
    id: "deep_forest",
    label: "Deep Forest",
    primary: "#2D6A4F",
    accent: "#95D5B2",
    neutral: "#E8F0E8",
    bg: "#1A2420",
    surface: "#243028",
  },
];

export function getPalettePreset(id: string): PalettePreset | undefined {
  return PALETTE_PRESETS.find((p) => p.id === id);
}

/** True when hex reads as light (luminance > 150). Mirrors site-config contrast guard. */
export function isLightHex(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) > 150;
}
