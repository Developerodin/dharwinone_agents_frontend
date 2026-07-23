import { describe, expect, it } from "vitest";
import { CafeWarmTemplate } from "./ht_cafe_v1/CafeWarmTemplate";
import { getLaunchTemplate, LAUNCH_TEMPLATES } from "./registry";

describe("launch registry", () => {
  it("keeps existing electrician templates registered", () => {
    expect(getLaunchTemplate("electrician_trust_v1")).toBeDefined();
    expect(getLaunchTemplate("electrician_bold_v1")).toBeDefined();
  });

  it("exposes default_content typed as full SiteContent (contact reachable)", () => {
    const entry = LAUNCH_TEMPLATES.electrician_trust_v1;
    const address: string | undefined = entry.default_content.contact?.address;
    expect(typeof address === "string" || address === undefined).toBe(true);
  });
});

describe("cafe launch registration", () => {
  it("routes ht_cafe_v1 to CafeWarmTemplate with cafe taxonomy", () => {
    const entry = getLaunchTemplate("ht_cafe_v1");
    expect(entry?.Component).toBe(CafeWarmTemplate);
    expect(entry?.registry.subcategory).toBe("cafe_restaurant");
    expect(entry?.registry.category).toBe("hospitality_travel");
  });
});
