import { describe, expect, it } from "vitest";
import { familyFromTemplateMeta, seedThemeJson } from "@/components/web-agent/sites/seedTheme";

describe("seedThemeJson", () => {
  it("seeds warm_craft with family accent and font pair", () => {
    const theme = seedThemeJson({ family: "warm_craft" }) as {
      brand: { accent: string };
      fontPair: string;
    };
    expect(theme.brand.accent).toBe("#a9631b");
    expect(theme.fontPair).toBe("fraunces_karla");
  });

  it("overrides accent when brandPrimary is provided", () => {
    const theme = seedThemeJson({
      family: "trust_local",
      brandPrimary: "#112233",
    }) as { brand: { accent: string } };
    expect(theme.brand.accent).toBe("#112233");
  });

  it("uses template style tag when present", () => {
    expect(familyFromTemplateMeta("foo_v1", ["fresh_retail"])).toBe("fresh_retail");
  });

  it("emits a dark ink (neutral) and a light page bg so text is readable", () => {
    const t = seedThemeJson({ family: "warm_craft" }) as {
      brand: { neutral: string; bg: string };
    };
    // --site-ink = brand.neutral, so it must be the dark tone, not the light paper.
    expect(t.brand.neutral).toBe("#2e1f13");
    expect(t.brand.bg).toBe("#f3ebdf");
  });

  it("picks the dark tone as ink even when the palette lists it under primary", () => {
    // bold_convert's palette stores the light tone in `primary` and the dark tone in `neutral`.
    const t = seedThemeJson({ family: "bold_convert" }) as { brand: { neutral: string; bg: string } };
    expect(t.brand.neutral).toBe("#111814"); // dark ink
    expect(t.brand.bg).toBe("#eef3ec"); // light page
  });
});
