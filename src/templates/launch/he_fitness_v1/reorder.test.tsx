import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SiteContent, SiteTheme } from "../../system/types";
import gymContent from "./default_content.json";
import gymTheme from "./default_theme.json";
import { GymNightShiftTemplate } from "./GymNightShiftTemplate";

const content = gymContent as unknown as SiteContent;

function renderOrder(theme: SiteTheme): string[] {
  const { container } = render(
    <GymNightShiftTemplate content={content} theme={theme} brandName="Test Gym" />,
  );
  return Array.from(container.querySelectorAll("[data-section]")).map(
    (el) => el.getAttribute("data-section")!,
  );
}

describe("GymNightShiftTemplate honors theme.sectionOrder", () => {
  it("renders sections in the theme order", () => {
    const order = renderOrder(gymTheme as SiteTheme);
    expect(order.indexOf("services")).toBeLessThan(order.indexOf("pricing"));
    expect(order.indexOf("pricing")).toBeLessThan(order.indexOf("faq"));
  });

  it("reflects a reordered sectionOrder in the DOM", () => {
    // Move pricing before services — the editor's drag-to-reorder result.
    const reordered = {
      ...(gymTheme as SiteTheme),
      sectionOrder: ["hero", "pricing", "services", "gallery", "faq", "contact", "cta_footer"],
    } as SiteTheme;
    const order = renderOrder(reordered);
    expect(order.indexOf("pricing")).toBeLessThan(order.indexOf("services"));
  });
});
