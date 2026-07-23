import { describe, expect, it } from "vitest";
import { PACKAGES } from "@/templates/packages";
import type { SiteRecord } from "@/lib/site-types";
import { isLaunchTemplateId, mergeContactFromProfile, phoneToWhatsAppHref, resolveTemplateId, siteRecordToConfig } from "./site-config";

function record(
  contentJson: Record<string, unknown>,
  themeJson: Record<string, unknown> = {},
): SiteRecord {
  return {
    siteId: "s1",
    userId: "u1",
    templateId: "ht_cafe_v1",
    templateVersion: null,
    businessProfileJson: {},
    contentJson,
    themeJson,
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

describe("siteRecordToConfig normalizes backend content field aliases", () => {
  it("maps faq question/answer to q/a", () => {
    const config = siteRecordToConfig(
      record({ faq: { section_title: "FAQ", items: [{ question: "Open?", answer: "Daily" }] } }),
    );
    expect(config.content.faq.items[0].q).toBe("Open?");
    expect(config.content.faq.items[0].a).toBe("Daily");
  });

  it("maps pricing title/desc to name/features", () => {
    const config = siteRecordToConfig(
      record({
        pricing: { section_title: "Menu", items: [{ title: "Coffee", desc: "Fresh brew", price: "₹50" }] },
      }),
    );
    const item = config.content.pricing.items[0];
    expect(item.name).toBe("Coffee");
    expect(item.price).toBe("₹50");
    expect(item.features).toContain("Fresh brew");
  });

  it("maps cta_footer text to headline", () => {
    const config = siteRecordToConfig(record({ cta_footer: { text: "Visit us today", cta_text: "Book" } }));
    expect(config.content.cta_footer.headline).toBe("Visit us today");
    expect(config.content.cta_footer.cta_text).toBe("Book");
  });
});

describe("mergeContactFromProfile", () => {
  it("overrides placeholder phone and address from businessProfile", () => {
    const fallback = siteRecordToConfig(record({ contact: { section_title: "Get In Touch" } })).content;
    const merged = mergeContactFromProfile(fallback, {
      whatsapp_number: "8755887760",
      city: "Jaipur",
    });
    expect(merged.contact.phone).toBe("+91 87558 87760");
    expect(merged.contact.address).toBe("Jaipur");
    expect(merged.contact.email).toBe("");
  });

  it("applies merge in siteRecordToConfig for draft preview", () => {
    const config = siteRecordToConfig({
      ...record({ contact: { section_title: "Get In Touch" } }),
      templateId: "he_fitness_v1",
      businessProfileJson: { whatsapp_number: "8755887760", city: "Jaipur" },
    });
    expect(config.content.contact.phone).toBe("+91 87558 87760");
    expect(config.content.contact.address).toBe("Jaipur");
  });

  it("clears placeholder email when whatsapp phone is provided", () => {
    const fallback = siteRecordToConfig(
      record({ contact: { email: "hello@ironleaffitness.example" } }),
    ).content;
    const merged = mergeContactFromProfile(fallback, {
      whatsapp_number: "8755887760",
      cta_preference: "whatsapp",
    });
    expect(merged.contact.email).toBe("");
    expect(merged.cta_footer.cta_text).toMatch(/whatsapp/i);
  });

  it("builds wa.me href for ten-digit Indian numbers", () => {
    expect(phoneToWhatsAppHref("+91 87558 87760")).toBe("https://wa.me/918755887760");
  });
});

describe("asSiteTheme guarantees readable ink contrast", () => {
  it("replaces a light ink on a light background with the dark brand color", () => {
    // Reproduces the old seedTheme output: neutral (ink) is a light paper tone.
    const config = siteRecordToConfig(
      record({}, { brand: { primary: "#2e1f13", accent: "#a9631b", neutral: "#f3ebdf", bg: "#f2e8d8" } }),
    );
    expect(config.theme.brand.neutral.toLowerCase()).toBe("#2e1f13");
  });

  it("leaves a correct dark-ink / light-bg theme untouched", () => {
    const config = siteRecordToConfig(
      record({}, { brand: { primary: "#e2a655", accent: "#e2a655", neutral: "#161009", bg: "#f2e8d8" } }),
    );
    expect(config.theme.brand.neutral.toLowerCase()).toBe("#161009");
  });
});
