import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { EditorPreview } from "./editor-preview";
import { useSiteEditorStore } from "@/store/site-editor-store";
import type { SiteConfig } from "@/lib/site-config";
import { getLaunchTemplate } from "@/templates/launch/registry";

// Launch templates (every web-agent site) tag sections with data-section, not
// BaseTemplate's data-section-key. Regression guard: the editor must select a
// section from data-section too, else web-agent sites are uneditable.
const tpl = getLaunchTemplate("ls_electrician_v1")!;
const launchConfig: SiteConfig = {
  siteId: "s1",
  templateId: "ls_electrician_v1",
  templateVersion: null,
  businessProfile: {},
  content: tpl.default_content,
  theme: tpl.default_theme,
};

describe("EditorPreview section selection", () => {
  beforeEach(() => {
    useSiteEditorStore.getState().loadConfig(structuredClone(launchConfig));
  });

  it("selects a launch section when a [data-section] element is clicked", () => {
    const { container } = render(<EditorPreview />);
    const section = container.querySelector("[data-section='hero']");
    expect(section).toBeTruthy();
    fireEvent.click(section!);
    expect(useSiteEditorStore.getState().selectedSection).toBe("hero");
  });

  it("selects a launch element when a [data-element-key] node is clicked", () => {
    const { container } = render(<EditorPreview />);
    const el = container.querySelector("[data-element-key='hero.headline']");
    expect(el).toBeTruthy();
    fireEvent.click(el!);
    expect(useSiteEditorStore.getState().selectedElementKey).toBe("hero.headline");
  });

  it("does not enable contentEditable until section Edit is clicked", () => {
    const { container } = render(<EditorPreview />);
    const el = container.querySelector("[data-element-key='hero.headline']") as HTMLElement;
    expect(el.contentEditable).toBe("false");

    const editBtn = container.querySelector("[data-section='hero'] .site-editor-section-edit-btn");
    expect(editBtn).toBeTruthy();
    fireEvent.click(editBtn!);

    const updated = container.querySelector("[data-element-key='hero.headline']") as HTMLElement;
    expect(updated.contentEditable).toBe("true");
  });

  it("renders per-section Edit controls in the preview", () => {
    const { container } = render(<EditorPreview />);
    const hero = container.querySelector("[data-section='hero']");
    expect(hero?.querySelector(".site-editor-section-edit-btn")).toBeTruthy();
  });
});
