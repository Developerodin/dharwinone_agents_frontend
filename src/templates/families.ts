import type { FamilyConfig, FamilyId } from "./system/types";

// The 6 design families + generic fallback (taxonomy spec §2).
// Palette defaults live in each package's default_theme.json; this file holds the
// parts of a design language that are NOT user-themable: type voice, layout
// variants, shape. Fonts are next/font variables (fonts.ts) with system fallbacks.

const SANS = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

export const FAMILIES: Record<FamilyId, FamilyConfig> = {
  // Warm paper + navy ink + amber. The construction-original lineage: sturdy,
  // local, review-forward. Single grotesk family, weight does the talking.
  trust_local: {
    id: "trust_local",
    fontHeading: `var(--font-archivo), ${SANS}`,
    fontBody: `var(--font-archivo), ${SANS}`,
    headingWeight: 800,
    hero: "split",
    services: "cards",
    testimonials: "cards",
    contact: "phone_first",
    radius: "0.5rem",
    headingSpacing: "-0.02em",
  },
  // Condensed uppercase display, vermilion on ink. Urgency without clutter.
  bold_convert: {
    id: "bold_convert",
    fontHeading: `var(--font-anton), "Arial Narrow", ${SANS}`,
    fontBody: `var(--font-archivo), ${SANS}`,
    headingWeight: 400, // Anton is single-weight; size carries hierarchy
    hero: "fullbleed",
    services: "tiles",
    testimonials: "quotes",
    contact: "band_cta",
    radius: "0.25rem",
    headingTransform: "uppercase",
    headingSpacing: "0.01em",
  },
  // Cool paper, steel blue, ember accent. Credential-forward without corporate chill.
  clean_pro: {
    id: "clean_pro",
    fontHeading: `var(--font-schibsted), ${SANS}`,
    fontBody: `var(--font-schibsted), ${SANS}`,
    headingWeight: 700,
    hero: "centered",
    services: "list",
    testimonials: "quotes",
    contact: "editorial",
    radius: "0.375rem",
    headingSpacing: "-0.015em",
  },
  // Onyx + gold, Marcellus display. Quiet luxury; zero radius, generous space.
  premium_dark: {
    id: "premium_dark",
    fontHeading: `var(--font-marcellus), ${SERIF}`,
    fontBody: `var(--font-mulish), ${SANS}`,
    headingWeight: 400,
    hero: "fullbleed",
    services: "list",
    testimonials: "quotes",
    contact: "quiet_dark",
    radius: "0",
    headingSpacing: "0.02em",
  },
  // Cream + espresso + rust, chunky Young Serif. The cafe-original lineage.
  warm_craft: {
    id: "warm_craft",
    fontHeading: `var(--font-youngserif), ${SERIF}`,
    fontBody: `var(--font-karla), ${SANS}`,
    headingWeight: 400,
    hero: "split",
    services: "tiles",
    testimonials: "cards",
    contact: "warm_block",
    radius: "1rem",
  },
  // Fern green + coral pop, Bricolage's quirk. Retail freshness without neon.
  fresh_retail: {
    id: "fresh_retail",
    fontHeading: `var(--font-bricolage), ${SANS}`,
    fontBody: `var(--font-karla), ${SANS}`,
    headingWeight: 800,
    hero: "centered",
    services: "cards",
    testimonials: "cards",
    contact: "chips",
    radius: "1rem",
    headingSpacing: "-0.02em",
  },
  generic: {
    id: "generic",
    fontHeading: `var(--font-archivo), ${SANS}`,
    fontBody: `var(--font-archivo), ${SANS}`,
    headingWeight: 700,
    hero: "centered",
    services: "cards",
    testimonials: "cards",
    contact: "editorial",
    radius: "0.5rem",
  },
};
