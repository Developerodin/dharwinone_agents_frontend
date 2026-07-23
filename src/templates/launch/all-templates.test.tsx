import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SiteContent, SiteTheme } from "../system/types";
import { PACKAGES } from "../packages";
import { getLaunchTemplate } from "./registry";

const ids = Object.keys(PACKAGES);

describe("all catalog packages render as bespoke launch templates", () => {
  it.each(ids)("renders %s with hero, gallery, pricing and faq sections", (id) => {
    const pkg = (PACKAGES as Record<string, { content: unknown; theme: unknown }>)[id];
    const def = getLaunchTemplate(id);
    expect(def, id).toBeDefined();
    if (!def) throw new Error(`missing launch template: ${id}`);
    const LaunchComponent = def.Component;
    const { container } = render(
      <LaunchComponent
        content={pkg.content as SiteContent}
        theme={pkg.theme as SiteTheme}
        brandName="Test Brand"
      />,
    );
    expect(container.querySelector('[data-section="hero"]'), `${id} hero`).not.toBeNull();
    expect(container.querySelector('[data-section="gallery"]'), `${id} gallery`).not.toBeNull();
    expect(container.querySelector('[data-section="pricing"]'), `${id} pricing`).not.toBeNull();
    expect(container.querySelector('[data-section="faq"]'), `${id} faq`).not.toBeNull();
    expect(container.textContent).toContain("Test Brand");
  });
});
