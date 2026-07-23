import { describe, expect, it } from "vitest";
import { PACKAGES } from "../packages";
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

describe("every package is a launch template", () => {
  it("registers all package ids plus the electrician bespoke pair", () => {
    for (const id of Object.keys(PACKAGES)) {
      expect(getLaunchTemplate(id), id).toBeDefined();
    }
    expect(getLaunchTemplate("electrician_trust_v1")).toBeDefined();
    expect(getLaunchTemplate("electrician_bold_v1")).toBeDefined();
  });

  it("assigns ht_cafe_v1 the warm_craft family from its registry", () => {
    expect(LAUNCH_TEMPLATES.ht_cafe_v1.registry.style_tags).toContain("warm_craft");
    expect(LAUNCH_TEMPLATES.ht_cafe_v1.registry.subcategory).toBe("cafe_restaurant");
  });
});
