import { describe, expect, it, beforeEach } from "vitest";
import { useSiteEditorStore } from "@/store/site-editor-store";
import type { SiteConfig } from "@/lib/site-config";
import type { SiteContent, SiteTheme } from "@/templates/system/types";

const baseContent = {
  hero: { headline: "A", subtext: "B", cta_text: "C" },
} as SiteContent;

const baseTheme = {
  brand: {
    logo_url: null,
    logo_dark_url: null,
    favicon_url: null,
    palette_from_logo: [],
    primary: "#111111",
    accent: "#222222",
    neutral: "#333333",
    bg: "#ffffff",
    surface: "#eeeeee",
  },
  fontPair: "inter",
  palettePreset: "navy_gold",
  sectionOverrides: {},
  elementOverrides: {},
  sectionOrder: ["hero", "services"] as SiteTheme["sectionOrder"],
  hiddenSections: [],
} satisfies SiteTheme;

const sampleConfig: SiteConfig = {
  siteId: "site-1",
  templateId: "ls_electrician_v1",
  templateVersion: "1",
  businessProfile: { business_name: "Test Co" },
  content: baseContent,
  theme: baseTheme,
};

describe("site-editor-store", () => {
  beforeEach(() => {
    useSiteEditorStore.getState().loadConfig(structuredClone(sampleConfig));
  });

  it("applies JSON patch dispatch and marks dirty", () => {
    useSiteEditorStore.getState().dispatch(
      [{ op: "replace", path: "/content/hero/headline", value: "New headline" }],
      "Edit headline",
    );
    const { config, saveStatus } = useSiteEditorStore.getState();
    expect(config?.content.hero.headline).toBe("New headline");
    expect(saveStatus).toBe("dirty");
  });

  it("undo/redo restores prior config", () => {
    const store = useSiteEditorStore.getState();
    store.dispatch([{ op: "replace", path: "/content/hero/headline", value: "Changed" }]);
    expect(store.canUndo()).toBe(true);
    store.undo();
    expect(useSiteEditorStore.getState().config?.content.hero.headline).toBe("A");
    store.redo();
    expect(useSiteEditorStore.getState().config?.content.hero.headline).toBe("Changed");
  });

  it("tracks unbilled changes against billed baseline", () => {
    const store = useSiteEditorStore.getState();
    expect(store.unbilledChangeCount()).toBe(0);
    store.dispatch([{ op: "replace", path: "/content/hero/headline", value: "Changed" }]);
    expect(useSiteEditorStore.getState().unbilledChangeCount()).toBe(1);
    useSiteEditorStore.getState().markChangesBilled();
    expect(useSiteEditorStore.getState().unbilledChangeCount()).toBe(0);
    useSiteEditorStore.getState().dispatch([
      { op: "replace", path: "/content/hero/subtext", value: "More" },
    ]);
    expect(useSiteEditorStore.getState().unbilledChangeCount()).toBe(1);
  });

  it("resets editing section and billing on loadConfig", () => {
    const store = useSiteEditorStore.getState();
    store.setEditingSection("hero");
    store.dispatch([{ op: "replace", path: "/content/hero/headline", value: "X" }]);
    store.markChangesBilled();
    useSiteEditorStore.getState().loadConfig(structuredClone(sampleConfig));
    const next = useSiteEditorStore.getState();
    expect(next.editingSectionKey).toBeNull();
    expect(next.billedChanges).toBe(0);
    expect(next.unbilledChangeCount()).toBe(0);
  });
});
