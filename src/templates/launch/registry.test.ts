import { describe, expect, it } from "vitest";
import { PACKAGES } from "../packages";
import { getLaunchTemplate, getRenderedSectionKeys, LAUNCH_TEMPLATES } from "./registry";

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

  it("assigns ht_cafe_v1 the warm_craft family and cafe subcategory", () => {
    expect(LAUNCH_TEMPLATES.ht_cafe_v1.registry.style_tags).toContain("warm_craft");
    expect(LAUNCH_TEMPLATES.ht_cafe_v1.registry.subcategory).toBe("cafe");
  });

  it("reports rendered sections: gym omits about/why_us/testimonials, compose renders all", () => {
    const gym = getRenderedSectionKeys("he_fitness_v1")!;
    expect(gym).toContain("gallery");
    expect(gym).not.toContain("about");
    expect(gym).not.toContain("why_us");
    expect(gym).not.toContain("testimonials");
    // Compose templates render the full section set.
    const cafe = getRenderedSectionKeys("ht_cafe_v1")!;
    expect(cafe).toEqual(expect.arrayContaining(["about", "why_us", "testimonials", "gallery"]));
    // Unknown template → null (caller shows all).
    expect(getRenderedSectionKeys("nope_v9")).toBeNull();
  });

  it("overrides he_fitness_v2 with the bespoke Studio Calm port (warm_craft, all sections)", () => {
    expect(LAUNCH_TEMPLATES.he_fitness_v2.registry.style_tags).toContain("warm_craft");
    expect(LAUNCH_TEMPLATES.he_fitness_v2.registry.subcategory).toBe("fitness_gym");
    // Bespoke overrides the generic compose entry with a real component.
    expect(LAUNCH_TEMPLATES.he_fitness_v2.Component.name).toBe("StudioCalmTemplate");
    const v2 = getRenderedSectionKeys("he_fitness_v2")!;
    expect(v2).toEqual(expect.arrayContaining(["about", "why_us", "gallery", "testimonials"]));
  });

  it("registers ht_restaurant_v1 as a premium_dark restaurant template", () => {
    expect(getLaunchTemplate("ht_restaurant_v1")).toBeDefined();
    expect(LAUNCH_TEMPLATES.ht_restaurant_v1.registry.subcategory).toBe("restaurant");
    expect(LAUNCH_TEMPLATES.ht_restaurant_v1.registry.style_tags).toContain("premium_dark");
  });
});
