import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { SiteConfig } from "@/lib/site-config";
import { imageSlotToContentPath } from "@/lib/site-config";
import type { SiteContent, SiteTheme } from "@/templates/system/types";
import { useSiteEditorStore } from "@/store/site-editor-store";
import { uploadSiteImage } from "@/lib/sites-api";
import { ImageSlotPanel } from "./section-panels";

vi.mock("@/lib/sites-api", () => ({
  uploadSiteImage: vi.fn(async () => "https://cdn/uploaded.png"),
}));

const content = {
  hero: { headline: "A", subtext: "B", cta_text: "C", image: "https://x/hero.jpg" },
  services: { section_title: "S", items: [{ title: "T", desc: "D", image: "https://x/s0.jpg" }] },
} as unknown as SiteContent;

const config: SiteConfig = {
  siteId: "site-1",
  templateId: "ls_electrician_v1",
  templateVersion: "1",
  businessProfile: { business_name: "Test Co" },
  content,
  theme: { sectionOrder: [], hiddenSections: [], sectionOverrides: {}, elementOverrides: {} } as unknown as SiteTheme,
};

const contentImage = (path: string) => {
  const segs = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let cur: unknown = useSiteEditorStore.getState().config?.content;
  for (const s of segs) cur = (cur as Record<string, unknown>)?.[s];
  return cur;
};

describe("imageSlotToContentPath", () => {
  it("maps hero.background and hero.image to hero.image, furniture to null", () => {
    expect(imageSlotToContentPath("hero.background")).toBe("hero.image");
    expect(imageSlotToContentPath("hero.image")).toBe("hero.image");
    expect(imageSlotToContentPath("services.items[2].image")).toBe("services.items[2].image");
    expect(imageSlotToContentPath("testimonials.items[0].avatar")).toBe("testimonials.items[0].avatar");
    expect(imageSlotToContentPath("clock.image")).toBeNull();
    expect(imageSlotToContentPath("coaches.0.image")).toBeNull();
  });
});

describe("ImageSlotPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSiteEditorStore.getState().loadConfig(structuredClone(config));
  });
  afterEach(cleanup);

  it("renders nothing when no slot is selected", () => {
    const { container } = render(<ImageSlotPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("changes a service image by URL, writing to the mapped content path", () => {
    useSiteEditorStore.getState().setSelectedImageSlot("services.items[0].image");
    render(<ImageSlotPanel />);
    fireEvent.change(screen.getByLabelText("Image URL"), {
      target: { value: "https://x/new.jpg" },
    });
    expect(contentImage("services.items[0].image")).toBe("https://x/new.jpg");
  });

  it("uploads a hero image to the asset endpoint and stores the returned URL", async () => {
    useSiteEditorStore.getState().setSelectedImageSlot("hero.background");
    render(<ImageSlotPanel />);
    const file = new File(["hi"], "hero.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload from device"), { target: { files: [file] } });
    await waitFor(() => expect(contentImage("hero.image")).toBe("https://cdn/uploaded.png"));
    // slotKey is the raw selected slot; assetType maps hero → "product".
    expect(uploadSiteImage).toHaveBeenCalledWith("site-1", file, {
      assetType: "product",
      slotKey: "hero.background",
    });
  });

  it("maps a services slot to the 'service' asset type", async () => {
    useSiteEditorStore.getState().setSelectedImageSlot("services.items[0].image");
    render(<ImageSlotPanel />);
    const file = new File(["hi"], "svc.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload from device"), { target: { files: [file] } });
    await waitFor(() =>
      expect(uploadSiteImage).toHaveBeenCalledWith("site-1", file, {
        assetType: "service",
        slotKey: "services.items[0].image",
      }),
    );
  });
});
