import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SiteTheme } from "../../system/types";
import { CtaButton, SlotImage } from "./primitives";

const theme = {
  brand: {
    logo_url: null,
    logo_dark_url: null,
    favicon_url: null,
    palette_from_logo: [],
    primary: "#111814",
    accent: "#f4562a",
    neutral: "#111814",
    bg: "#eef3ec",
    surface: "#eef3ec",
  },
  fontPair: "anton_archivo",
  palettePreset: "ink_vermilion",
  sectionOverrides: {},
  elementOverrides: {},
  sectionOrder: ["hero"],
  hiddenSections: [],
} as unknown as SiteTheme;

describe("CtaButton", () => {
  it("keeps accent fill when there is no element override", () => {
    const { container } = render(
      <CtaButton elementKey="hero.cta_button" theme={theme}>
        Book a Free Session
      </CtaButton>,
    );
    const btn = container.querySelector("a");
    expect(btn?.style.backgroundColor).toBe("var(--site-accent)");
    expect(btn?.style.color).toBe("var(--site-on-accent)");
    expect(btn?.getAttribute("style")).not.toContain("--el-hero-cta_button-bg");
  });

  it("renders ghost buttons with a line border, not a naked browser outline", () => {
    const { container } = render(
      <CtaButton elementKey="hero.cta_secondary" theme={theme} ghost>
        See the 24h clock
      </CtaButton>,
    );
    const btn = container.querySelector("a");
    expect(btn?.style.backgroundColor).toBe("transparent");
    expect(btn?.style.border).toContain("var(--site-line)");
  });
});

describe("SlotImage", () => {
  it("fills a fixed-height frame with absolute object-cover", () => {
    const { container } = render(
      <SlotImage
        slot="hero.image"
        src="https://example.com/hero.jpg"
        alt="Hero"
        className="h-[280px] w-full"
      />,
    );
    const frame = container.querySelector("[data-image-slot='hero.image']");
    const img = container.querySelector("img");
    expect(frame?.className).toContain("relative");
    expect(frame?.className).toContain("h-[280px]");
    expect(img?.className).toContain("absolute");
    expect(img?.className).toContain("object-cover");
  });
});
