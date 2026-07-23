import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { SiteConfig } from "@/lib/site-config";
import type { SiteContent, SiteTheme } from "@/templates/system/types";
import { useSiteEditorStore } from "@/store/site-editor-store";
import { uploadSiteImage } from "@/lib/sites-api";
import { GalleryImagesPanel } from "./section-panels";

vi.mock("@/lib/sites-api", () => ({
  uploadSiteImage: vi.fn(async () => "https://cdn/uploaded.png"),
}));

const content = {
  hero: { headline: "A", subtext: "B", cta_text: "C" },
  gallery: {
    section_title: "Gallery",
    items: [{ caption: "One", image: "https://x/1.jpg" }],
  },
} as unknown as SiteContent;

const theme = {
  brand: { primary: "#111", accent: "#222", neutral: "#333", bg: "#fff", surface: "#eee" },
  sectionOverrides: {},
  elementOverrides: {},
  sectionOrder: ["gallery"],
  hiddenSections: [],
} as unknown as SiteTheme;

const config: SiteConfig = {
  siteId: "site-1",
  templateId: "ls_electrician_v1",
  templateVersion: "1",
  businessProfile: { business_name: "Test Co" },
  content,
  theme,
};

const galleryItems = () =>
  (useSiteEditorStore.getState().config?.content.gallery.items ?? []) as {
    caption: string;
    image?: string;
  }[];

describe("GalleryImagesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSiteEditorStore.getState().loadConfig(structuredClone(config));
    useSiteEditorStore.getState().setSelectedSection("gallery");
    // The preview probe reports the gallery renders editable image slots.
    useSiteEditorStore.getState().setPreviewCaps({ galleryImages: true, frameFixedSections: [] });
  });

  afterEach(cleanup);

  it("shows a fixed-layout note when the template's gallery isn't editable", () => {
    useSiteEditorStore.getState().setPreviewCaps({ galleryImages: false, frameFixedSections: [] });
    render(<GalleryImagesPanel />);
    expect(screen.getByText(/fixed layout/i)).toBeTruthy();
    expect(screen.queryByText("+ Add image")).toBeNull();
  });

  it("renders nothing unless the gallery section is selected", () => {
    useSiteEditorStore.getState().setSelectedSection("hero");
    const { container } = render(<GalleryImagesPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("adds an image", () => {
    render(<GalleryImagesPanel />);
    fireEvent.click(screen.getByText("+ Add image"));
    expect(galleryItems()).toHaveLength(2);
  });

  it("changes an image URL", () => {
    render(<GalleryImagesPanel />);
    fireEvent.change(screen.getByLabelText("Image 1 URL"), {
      target: { value: "https://x/new.jpg" },
    });
    expect(galleryItems()[0].image).toBe("https://x/new.jpg");
  });

  it("removes an image", () => {
    render(<GalleryImagesPanel />);
    fireEvent.click(screen.getByText("Remove"));
    expect(galleryItems()).toHaveLength(0);
  });

  it("uploads an image to the asset endpoint and stores the returned URL", async () => {
    render(<GalleryImagesPanel />);
    const file = new File(["hello"], "photo.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload from device"), {
      target: { files: [file] },
    });
    await waitFor(() => expect(galleryItems()[0].image).toBe("https://cdn/uploaded.png"));
    expect(uploadSiteImage).toHaveBeenCalledWith("site-1", file, {
      assetType: "product",
      slotKey: "gallery.items[0].image",
    });
  });

  it("rejects an oversized upload without hitting the endpoint", () => {
    render(<GalleryImagesPanel />);
    const big = new File([new Uint8Array(11 * 1024 * 1024)], "big.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload from device"), {
      target: { files: [big] },
    });
    expect(screen.getByText(/too large/i)).toBeTruthy();
    expect(galleryItems()[0].image).toBe("https://x/1.jpg");
    expect(uploadSiteImage).not.toHaveBeenCalled();
  });
});
