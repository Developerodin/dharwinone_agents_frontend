import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SiteContent, SiteTheme } from "../../system/types";
import cafeContent from "../../packages/ht_cafe_v1/default_content.json";
import cafeTheme from "../../packages/ht_cafe_v1/default_theme.json";
import { CafeWarmTemplate } from "./CafeWarmTemplate";

const content = cafeContent as unknown as SiteContent;
const theme = cafeTheme as unknown as SiteTheme;

describe("CafeWarmTemplate", () => {
  it("renders the cafe sections from its content", () => {
    const { container } = render(
      <CafeWarmTemplate content={content} theme={theme} brandName="Amber Oven Cafe" />,
    );
    expect(container.querySelector('[data-section="services"]')).not.toBeNull();
    expect(container.querySelector('[data-section="about"]')).not.toBeNull();
    expect(container.querySelector('[data-section="contact"]')).not.toBeNull();
    expect(container.textContent).toContain("Amber Oven Cafe");
  });

  it("returns null without content", () => {
    const { container } = render(<CafeWarmTemplate />);
    expect(container.firstChild).toBeNull();
  });
});
