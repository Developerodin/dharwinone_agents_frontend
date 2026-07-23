import { describe, expect, it } from "vitest";
import { PALETTE_PRESETS, getPalettePreset, isLightHex } from "./palette-presets";
import { applyPalettePreset } from "./site-config";
import type { SiteTheme } from "@/templates/system/types";

const baseTheme = (): SiteTheme => ({
  palettePreset: "navy_gold",
  fontPair: "inter",
  brand: {
    logo_url: null,
    logo_dark_url: null,
    favicon_url: null,
    palette_from_logo: [],
    primary: "#000",
    accent: "#000",
    neutral: "#000",
    bg: "#fff",
    surface: "#eee",
  },
  sectionOverrides: {},
  elementOverrides: {},
  sectionOrder: ["hero"],
  hiddenSections: [],
});

describe("PALETTE_PRESETS", () => {
  it("has at least 18 presets with unique ids", () => {
    expect(PALETTE_PRESETS.length).toBeGreaterThanOrEqual(18);
    const ids = PALETTE_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses distinct page backgrounds — not all clustered near white", () => {
    const bgLuminance = PALETTE_PRESETS.map((p) => {
      const m = /^#([0-9a-f]{6})$/i.exec(p.bg);
      if (!m) return 0;
      const n = parseInt(m[1], 16);
      return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    });
    const lightBgs = bgLuminance.filter((l) => l > 150);
    const darkBgs = bgLuminance.filter((l) => l <= 150);
    expect(lightBgs.length).toBeGreaterThanOrEqual(14);
    expect(darkBgs.length).toBeGreaterThanOrEqual(2);
    const spread = Math.max(...bgLuminance) - Math.min(...bgLuminance);
    expect(spread).toBeGreaterThan(100);
  });

  it("keeps ink/bg contrast for every preset", () => {
    for (const preset of PALETTE_PRESETS) {
      expect(isLightHex(preset.neutral)).not.toBe(isLightHex(preset.bg));
    }
  });

  it("includes dark-background presets", () => {
    const dark = PALETTE_PRESETS.filter((p) => !isLightHex(p.bg));
    expect(dark.map((p) => p.id)).toEqual(expect.arrayContaining(["obsidian_gold", "deep_forest"]));
  });
});

describe("getPalettePreset", () => {
  it("returns preset by id", () => {
    expect(getPalettePreset("sage_stone")?.label).toBe("Sage Meadow");
  });

  it("returns undefined for unknown id", () => {
    expect(getPalettePreset("missing")).toBeUndefined();
  });
});

describe("applyPalettePreset", () => {
  it("applies all brand tokens from the preset", () => {
    const next = applyPalettePreset(baseTheme(), "rose_blush");
    expect(next.palettePreset).toBe("rose_blush");
    expect(next.brand.bg).toBe("#FAE8EC");
    expect(next.brand.primary).toBe("#BE185D");
    expect(next.brand.neutral).toBe("#500724");
  });

  it("applies dark preset with light ink", () => {
    const next = applyPalettePreset(baseTheme(), "obsidian_gold");
    expect(next.brand.bg).toBe("#1C1C22");
    expect(isLightHex(next.brand.neutral)).toBe(true);
  });
});
