// Core JSON shapes for the template system (WhatsApp spec §6).
// Final render = template(id@version) + SiteContent + SiteTheme. Nothing else.

export interface SiteContent {
  hero: { headline: string; subtext: string; cta_text: string; image?: string };
  services: { section_title: string; items: { title: string; desc: string; image?: string }[] };
  about: { section_title: string; body: string; image?: string };
  why_us: { section_title: string; points: string[] };
  gallery: { section_title: string; items: { caption: string; image?: string }[] };
  testimonials: { section_title: string; items: { name: string; quote: string; avatar?: string }[] };
  pricing: { section_title: string; items: { name: string; price: string; features: string[] }[] };
  faq: { section_title: string; items: { q: string; a: string }[] };
  contact: { section_title: string; address: string; phone: string; email: string; hours: string };
  cta_footer: { headline: string; cta_text: string };
  seo?: { title: string; description: string };
}

export type SectionKey = Exclude<keyof SiteContent, "seo">;

export interface SectionOverride {
  bgColor?: string;
  textColor?: string;
  align?: "left" | "center";
  padding?: "compact" | "normal" | "spacious";
  height?: "short" | "normal" | "tall";
}

export interface ElementOverride {
  bg?: string;
  textColor?: string;
  radius?: "none" | "md" | "full";
  size?: "sm" | "md" | "lg";
}

export interface SiteTheme {
  brand: {
    logo_url: string | null;
    logo_dark_url: string | null;
    favicon_url: string | null;
    palette_from_logo: string[];
    primary: string;
    accent: string;
    neutral: string;
    bg: string;
    surface: string;
  };
  fontPair: string;
  palettePreset: string;
  sectionOverrides: Partial<Record<SectionKey, SectionOverride>>;
  elementOverrides: Record<string, ElementOverride>;
  sectionOrder: SectionKey[];
  hiddenSections: SectionKey[];
}

// Family = the design language (style_tags[0]). Sections are interchangeable
// between templates ONLY within the same family (taxonomy rule 7.8).
export type FamilyId =
  | "trust_local"
  | "bold_convert"
  | "clean_pro"
  | "premium_dark"
  | "warm_craft"
  | "fresh_retail"
  | "generic";

export interface FamilyConfig {
  id: FamilyId;
  /** CSS font stacks — no webfont deps, system stacks only. */
  fontHeading: string;
  fontBody: string;
  headingWeight: number;
  /** Layout variants each section component switches on. */
  hero: "split" | "centered" | "fullbleed";
  services: "cards" | "list" | "tiles";
  testimonials: "cards" | "quotes";
  contact: "phone_first" | "band_cta" | "editorial" | "quiet_dark" | "warm_block" | "chips";
  radius: string; // e.g. "0.75rem"
  headingTransform?: "none" | "uppercase";
  headingSpacing?: string; // letter-spacing for display type
}
