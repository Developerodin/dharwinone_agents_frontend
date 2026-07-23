import type { FamilyId } from "@/lib/sites-types";

const DEFAULT_SECTION_ORDER = [
  "hero",
  "services",
  "about",
  "why_us",
  "gallery",
  "testimonials",
  "pricing",
  "faq",
  "contact",
  "cta_footer",
];

const FAMILY_PALETTES: Record<
  FamilyId,
  { primary: string; accent: string; neutral: string }
> = {
  trust_local: { primary: "#26231c", accent: "#38586e", neutral: "#e9e5db" },
  bold_convert: { primary: "#eef3ec", accent: "#f4562a", neutral: "#111814" },
  clean_pro: { primary: "#232029", accent: "#7c2d3e", neutral: "#edebe5" },
  premium_dark: { primary: "#14282e", accent: "#c9631f", neutral: "#edf0e9" },
  warm_craft: { primary: "#2e1f13", accent: "#a9631b", neutral: "#f3ebdf" },
  fresh_retail: { primary: "#182433", accent: "#0d6e60", neutral: "#f2f5f9" },
};

const FAMILY_FONT_PAIRS: Record<FamilyId, string> = {
  trust_local: "barlow_condensed",
  bold_convert: "oswald_inter",
  clean_pro: "fraunces_inter",
  premium_dark: "bricolage_instrument",
  warm_craft: "fraunces_karla",
  fresh_retail: "bricolage_inter",
};

const FAMILY_IDS = new Set<string>(Object.keys(FAMILY_PALETTES));

export function familyFromTemplateMeta(
  templateId: string,
  styleTags?: string[],
): FamilyId {
  const tag = styleTags?.[0];
  if (tag && FAMILY_IDS.has(tag)) return tag as FamilyId;

  const id = templateId.toLowerCase();
  if (/bold|fitness|gym|convert/.test(id)) return "bold_convert";
  if (/clean|pro|agency|professional/.test(id)) return "clean_pro";
  if (/premium|dark|travel|luxury/.test(id)) return "premium_dark";
  if (/warm|craft|cafe|bakery/.test(id)) return "warm_craft";
  if (/fresh|retail|saas|shop|store/.test(id)) return "fresh_retail";
  if (/trust|local|electric|construction|trades/.test(id)) return "trust_local";
  return "trust_local";
}

/** Relative luminance test for a #rrggbb hex — true if the colour reads "light". */
function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) > 150;
}

export function seedThemeJson(args: {
  family: FamilyId;
  brandPrimary?: string;
  logoUrl?: string;
  sectionOrder?: string[];
}): Record<string, unknown> {
  const palette = FAMILY_PALETTES[args.family];
  const accent = args.brandPrimary?.trim() || palette.accent;
  // The render contract reads --site-ink from brand.neutral (must be the dark tone)
  // and --site-bg from brand.bg (the light tone). Pick by luminance — the palette
  // table isn't consistent about which field holds which.
  const ink = isLight(palette.primary) ? palette.neutral : palette.primary;
  const paper = isLight(palette.primary) ? palette.primary : palette.neutral;

  return {
    brand: {
      primary: ink,
      accent,
      neutral: ink,
      bg: paper,
      surface: paper,
      ...(args.logoUrl ? { logoUrl: args.logoUrl } : {}),
    },
    fontPair: FAMILY_FONT_PAIRS[args.family],
    sectionOrder: args.sectionOrder?.length ? args.sectionOrder : DEFAULT_SECTION_ORDER,
    sectionOverrides: {},
    elementOverrides: {},
    imageOverrides: {},
    hiddenSections: [],
  };
}
