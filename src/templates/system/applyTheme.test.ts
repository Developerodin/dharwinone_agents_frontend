import { describe, expect, it } from "vitest";
import { FAMILIES } from "../families";
import { applySiteTheme, elementStyle, sectionStyle } from "./applyTheme";
import type { SiteTheme } from "./types";

const theme: SiteTheme = {
  brand: {
    logo_url: null,
    logo_dark_url: null,
    favicon_url: null,
    palette_from_logo: [],
    primary: "#23425F",
    accent: "#D9821B",
    neutral: "#2A2620",
    bg: "#EFECE3",
    surface: "#E7E2D6",
  },
  fontPair: "archivo",
  palettePreset: "paper_navy_amber",
  sectionOverrides: {
    hero: { bgColor: "#0F172A", textColor: "#FFFFFF", height: "tall" },
  },
  elementOverrides: {
    "hero.cta_button": { bg: "#D9821B", textColor: "#2A2620", radius: "full", size: "lg" },
  },
  sectionOrder: ["hero", "services", "why_us", "testimonials", "cta_footer"],
  hiddenSections: [],
};

describe("applySiteTheme", () => {
  it("writes brand, section, and element CSS vars on the root", () => {
    const vars = applySiteTheme(theme, FAMILIES.trust_local) as Record<string, string>;
    expect(vars["--site-primary"]).toBe("#23425F");
    expect(vars["--site-accent"]).toBe("#D9821B");
    expect(vars["--section-hero-bg"]).toBe("#0F172A");
    expect(vars["--el-hero-cta_button-bg"]).toBe("#D9821B");
    expect(vars["--site-font-heading"]).toContain("var(--font-archivo)");
  });

  it("derives section and element inline styles from theme JSON", () => {
    const section = sectionStyle(theme, "hero");
    expect(section.backgroundColor).toBe("#0F172A");
    expect(section.color).toBe("#FFFFFF");
    expect(section.minHeight).toBe("80vh");

    const el = elementStyle(theme, "hero.cta_button");
    expect(el.backgroundColor).toBe("#D9821B");
    expect(el.borderRadius).toBe("9999px");
  });

  it("returns no inline styles when the element has no theme override", () => {
    expect(elementStyle(theme, "hero.cta_secondary")).toEqual({});
  });
});
