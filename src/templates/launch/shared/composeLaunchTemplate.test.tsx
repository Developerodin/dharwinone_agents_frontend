import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SiteContent, SiteTheme } from "../../system/types";
import { composeLaunchTemplate } from "./composeLaunchTemplate";

const theme = {
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
  sectionOverrides: {},
  elementOverrides: {},
  sectionOrder: ["hero", "services"],
  hiddenSections: [],
} as unknown as SiteTheme;

const content = {
  hero: { headline: "H", subtext: "S", cta_text: "Go" },
  services: { section_title: "Svc", items: [{ title: "T", desc: "D" }] },
  seo: { title: "Brand — X", description: "" },
} as unknown as SiteContent;

describe("composeLaunchTemplate", () => {
  it("renders only sections present in sectionOrder using the preset renderers", () => {
    const Tpl = composeLaunchTemplate("demo_v1", {
      family: "trust_local",
      eyebrow: "Demo",
      sections: {
        hero: (c) => <div data-section="hero">{c.hero.headline}</div>,
        services: (c) => <div data-section="services">{c.services.section_title}</div>,
        faq: () => <div data-section="faq">should-not-appear</div>,
      },
    });
    const { container } = render(<Tpl content={content} theme={theme} brandName="Brand" />);
    expect(container.querySelector('[data-section="hero"]')?.textContent).toBe("H");
    expect(container.querySelector('[data-section="services"]')).not.toBeNull();
    expect(container.querySelector('[data-section="faq"]')).toBeNull();
    expect(container.textContent).toContain("Brand");
  });

  it("returns null without content or theme", () => {
    const Tpl = composeLaunchTemplate("demo_v1", { family: "generic", eyebrow: "x", sections: {} });
    const { container } = render(<Tpl />);
    expect(container.firstChild).toBeNull();
  });
});
