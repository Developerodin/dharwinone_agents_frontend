import { describe, expect, it } from "vitest";
import { PACKAGES } from "@/templates/packages";
import type { SiteRecord } from "@/lib/site-types";
import { isLaunchTemplateId, resolveTemplateId, siteRecordToConfig } from "./site-config";

function record(contentJson: Record<string, unknown>): SiteRecord {
  return {
    siteId: "s1",
    userId: "u1",
    templateId: "ht_cafe_v1",
    templateVersion: null,
    businessProfileJson: {},
    contentJson,
    themeJson: {},
    status: "draft",
    subdomain: null,
    customDomain: null,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("site-config template routing", () => {
  it("treats ht_cafe_v1 as a launch template (bespoke render path)", () => {
    expect(isLaunchTemplateId("ht_cafe_v1")).toBe(true);
    expect(resolveTemplateId("ht_cafe_v1")).toBe("ht_cafe_v1");
  });
});

describe("all packages route to the bespoke launch path", () => {
  it.each(Object.keys(PACKAGES))("%s is a launch template", (id) => {
    expect(isLaunchTemplateId(id)).toBe(true);
    expect(resolveTemplateId(id)).toBe(id);
  });
});

describe("siteRecordToConfig backfills partial sections", () => {
  it("keeps fallback gallery.items when persisted gallery omits items", () => {
    // A draft persisted with only a renamed section title, no items array.
    const config = siteRecordToConfig(record({ gallery: { section_title: "Our Space" } }));
    expect(config.content.gallery.section_title).toBe("Our Space");
    expect(Array.isArray(config.content.gallery.items)).toBe(true);
    expect(config.content.gallery.items.length).toBeGreaterThan(0);
  });

  it("backfills items for every section that carries an items array", () => {
    const config = siteRecordToConfig(
      record({
        services: { section_title: "What we do" },
        pricing: { section_title: "Plans" },
        faq: { section_title: "Questions" },
        testimonials: { section_title: "Reviews" },
      }),
    );
    for (const key of ["services", "pricing", "faq", "testimonials", "gallery"] as const) {
      expect(Array.isArray(config.content[key].items), key).toBe(true);
    }
  });

  it("lets persisted items override the fallback", () => {
    const config = siteRecordToConfig(
      record({ gallery: { section_title: "G", items: [{ caption: "Only one" }] } }),
    );
    expect(config.content.gallery.items).toHaveLength(1);
    expect(config.content.gallery.items[0].caption).toBe("Only one");
  });
});
