import { describe, expect, it } from "vitest";
import type { SectionKey } from "../../system/types";
import { FAMILY_PRESETS } from "./familyPresets";

const FAMILIES = [
  "trust_local",
  "bold_convert",
  "clean_pro",
  "premium_dark",
  "warm_craft",
  "fresh_retail",
  "generic",
] as const;

describe("FAMILY_PRESETS", () => {
  it("defines a preset for all 7 families", () => {
    for (const f of FAMILIES) expect(FAMILY_PRESETS[f], f).toBeTypeOf("function");
  });

  it("each preset covers all 10 sections", () => {
    const keys: SectionKey[] = [
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
    for (const f of FAMILIES) {
      const preset = FAMILY_PRESETS[f]("Eyebrow");
      expect(preset.family).toBe(f);
      for (const k of keys) expect(preset.sections[k], `${f}.${k}`).toBeTypeOf("function");
    }
  });
});
