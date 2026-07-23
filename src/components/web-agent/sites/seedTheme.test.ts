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
});
