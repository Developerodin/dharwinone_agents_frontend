"use client";

import { useState, type ReactNode } from "react";
import type { SectionKey, SectionOverride } from "@/templates/system/types";
import { ContrastWarning } from "@/components/site-editor/contrast-warning";
import { contentPathToPatch } from "@/lib/json-patch";
import { imageSlotToContentPath, contentValueAt } from "@/lib/site-config";
import { uploadSiteImage } from "@/lib/sites-api";
import { useSiteEditorStore } from "@/store/site-editor-store";

const SECTION_LABELS: Record<SectionKey, string> = {
  hero: "Hero",
  services: "Services",
  about: "About",
  why_us: "Why us",
  gallery: "Gallery",
  testimonials: "Testimonials",
  pricing: "Pricing",
  faq: "FAQ",
  contact: "Contact",
  cta_footer: "Footer CTA",
};

function patchSectionOverride(section: SectionKey, patch: Partial<SectionOverride>, label: string) {
  return [
    {
      op: "replace" as const,
      path: `/theme/sectionOverrides/${section}`,
      value: patch,
    },
  ];
}

export function SectionStylePanel() {
  const config = useSiteEditorStore((s) => s.config);
  const selectedSection = useSiteEditorStore((s) => s.selectedSection);
  const frameFixedSections = useSiteEditorStore((s) => s.previewCaps.frameFixedSections);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  if (!config || !selectedSection) {
    return (
      <p className="text-xs text-textmuted">Select a section in the preview or list to edit its style.</p>
    );
  }

  // Bespoke templates hardcode this section's frame (it ignores sectionStyle), so
  // the color/spacing/alignment controls would do nothing. Point the user at the
  // controls that do work instead of showing dead inputs.
  if (frameFixedSections.includes(selectedSection)) {
    return (
      <PanelNote title={SECTION_LABELS[selectedSection]}>
        This section’s background, spacing and alignment are set by the template
        layout. Use the <span className="font-medium text-defaulttextcolor">Palette</span> or{" "}
        <span className="font-medium text-defaulttextcolor">Brand colors</span> panels for
        site-wide changes, or click any text or image in it to edit that directly.
      </PanelNote>
    );
  }

  const current = config.theme.sectionOverrides[selectedSection] ?? {};
  const merged = { ...current };

  const update = (patch: Partial<SectionOverride>) => {
    dispatch(
      patchSectionOverride(selectedSection, { ...merged, ...patch }, `Section ${selectedSection}`),
      `Section ${selectedSection}`,
    );
  };

  const bg = merged.bgColor ?? config.theme.brand.bg;
  const text = merged.textColor ?? config.theme.brand.neutral;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-textmuted">{SECTION_LABELS[selectedSection]}</h3>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Background</span>
        <input
          type="color"
          value={bg.startsWith("#") ? bg : "#ffffff"}
          onChange={(e) => update({ bgColor: e.target.value })}
          className="h-9 w-full cursor-pointer rounded border border-inputborder"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Text color</span>
        <input
          type="color"
          value={text.startsWith("#") ? text : "#000000"}
          onChange={(e) => update({ textColor: e.target.value })}
          className="h-9 w-full cursor-pointer rounded border border-inputborder"
        />
      </label>
      <ContrastWarning fg={text} bg={bg} onFixText={(fixedFg) => update({ textColor: fixedFg })} />
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Padding</span>
        <select
          value={merged.padding ?? "normal"}
          onChange={(e) => update({ padding: e.target.value as SectionOverride["padding"] })}
          className="form-control text-xs"
        >
          <option value="compact">Compact</option>
          <option value="normal">Normal</option>
          <option value="spacious">Spacious</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Alignment</span>
        <select
          value={merged.align ?? "left"}
          onChange={(e) => update({ align: e.target.value as SectionOverride["align"] })}
          className="form-control text-xs"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
        </select>
      </label>
    </div>
  );
}

export function ElementOverridePanel() {
  const config = useSiteEditorStore((s) => s.config);
  const selectedElementKey = useSiteEditorStore((s) => s.selectedElementKey);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  if (!config || !selectedElementKey) {
    return (
      <p className="text-xs text-textmuted">Click an element in the preview to override its style.</p>
    );
  }

  const current = config.theme.elementOverrides[selectedElementKey] ?? {};

  const setOverride = (patch: Partial<typeof current>) => {
    const next = { ...config.theme.elementOverrides, [selectedElementKey]: { ...current, ...patch } };
    dispatch([{ op: "replace", path: "/theme/elementOverrides", value: next }], `Element ${selectedElementKey}`);
  };

  const bg = current.bg ?? config.theme.brand.accent;
  const text = current.textColor ?? config.theme.brand.neutral;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold font-mono text-defaulttextcolor">{selectedElementKey}</h3>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Background</span>
        <input
          type="color"
          value={bg.startsWith("#") ? bg : "#ffffff"}
          onChange={(e) => setOverride({ bg: e.target.value })}
          className="h-9 w-full cursor-pointer rounded border border-inputborder"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Text color</span>
        <input
          type="color"
          value={text.startsWith("#") ? text : "#000000"}
          onChange={(e) => setOverride({ textColor: e.target.value })}
          className="h-9 w-full cursor-pointer rounded border border-inputborder"
        />
      </label>
      <ContrastWarning
        fg={text}
        bg={bg}
        onFixText={(fixedFg) => setOverride({ textColor: fixedFg })}
      />
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Radius</span>
        <select
          value={current.radius ?? "md"}
          onChange={(e) => setOverride({ radius: e.target.value as typeof current.radius })}
          className="form-control text-xs"
        >
          <option value="none">None</option>
          <option value="md">Medium</option>
          <option value="full">Pill</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium">Size</span>
        <select
          value={current.size ?? "md"}
          onChange={(e) => setOverride({ size: e.target.value as typeof current.size })}
          className="form-control text-xs"
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </label>
    </div>
  );
}

type GalleryItem = { caption: string; image?: string };

// Device uploads go to the site's real asset store (presign → S3 → confirm) and
// only the returned public URL is saved in the config — no more inline base64.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// The backend allows a fixed set of asset types (logo/brand/service/team/
// product); map an image slot to the closest one. The real slot path is carried
// separately as slotKey, so this is only a coarse tag.
function assetTypeForSlot(slot: string): string {
  if (slot.startsWith("services")) return "service";
  if (slot.startsWith("testimonials")) return "team";
  return "product";
}

/** Sidebar sub-panel heading — one style everywhere for a consistent rhythm. */
function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-textmuted">{children}</h3>
  );
}

/** Shown in place of a control that doesn't apply to the current template/section,
 *  so the sidebar never presents dead controls (matches the other helper text). */
function PanelNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <PanelHeading>{title}</PanelHeading>
      <p className="text-xs leading-relaxed text-textmuted">{children}</p>
    </div>
  );
}

/** Legacy device uploads were stored inline as data: URLs, which are unreadable
 *  in a text field. Show an empty field with a friendly placeholder so the user
 *  can paste a replacement; the thumbnail still renders the real value. New
 *  uploads store https URLs, so this only affects older saved configs. */
function urlFieldProps(value: string): { value: string; placeholder: string } {
  const isData = value.startsWith("data:");
  return {
    value: isData ? "" : value,
    placeholder: isData ? "Uploaded image — paste a URL to replace" : "Image URL (https://…)",
  };
}

/** Add / change / remove images in the Gallery section. Shown only when the
 *  gallery section is selected AND the template renders editable image slots.
 *  Images take a URL or a device upload (real asset endpoint). ponytail:
 *  whole-array replace keeps the patch logic trivial; switch to add/remove ops
 *  only if arrays get large. */
export function GalleryImagesPanel() {
  const config = useSiteEditorStore((s) => s.config);
  const selectedSection = useSiteEditorStore((s) => s.selectedSection);
  const galleryEditable = useSiteEditorStore((s) => s.previewCaps.galleryImages);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const gallery = config?.content.gallery;
  if (!config || selectedSection !== "gallery" || !gallery) return null;

  // The gallery slot exists in content but this template renders a fixed layout
  // (e.g. a schedule) instead of an image grid, so managing images here would
  // edit data that never appears. Say so rather than show orphaned items.
  if (!galleryEditable) {
    return (
      <PanelNote title="Gallery images">
        This template’s gallery has a fixed layout, so its images can’t be managed
        here. Click any photo in the preview to swap it in place.
      </PanelNote>
    );
  }

  const items: GalleryItem[] = gallery.items ?? [];

  const commit = (next: GalleryItem[], label: string) => {
    dispatch([{ op: "replace", path: "/content/gallery/items", value: next }], label);
  };
  const update = (i: number, patch: Partial<GalleryItem>) =>
    commit(
      items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
      "Edit gallery image",
    );
  const add = () => commit([...items, { caption: "", image: "" }], "Add gallery image");
  const remove = (i: number) => commit(items.filter((_, idx) => idx !== i), "Remove gallery image");

  const upload = async (i: number, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large (max 10 MB). Use a smaller file or paste a URL.");
      return;
    }
    setError(null);
    setUploadingIndex(i);
    try {
      const url = await uploadSiteImage(config.siteId, file, {
        assetType: "product",
        slotKey: `gallery.items[${i}].image`,
      });
      update(i, { image: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again or paste a URL.");
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-textmuted">Gallery images</h3>
      {items.length === 0 ? (
        <p className="text-xs text-textmuted">No images yet. Add one below.</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-lg border border-defaultborder p-2">
          <div className="flex items-start gap-2">
            <div
              className="h-12 w-12 shrink-0 rounded border border-defaultborder bg-light bg-cover bg-center"
              style={it.image ? { backgroundImage: `url("${it.image}")` } : undefined}
              aria-hidden
            />
            <div className="flex-1 space-y-1">
              <input
                type="url"
                {...urlFieldProps(it.image ?? "")}
                aria-label={`Image ${i + 1} URL`}
                onChange={(e) => update(i, { image: e.target.value })}
                className="form-control text-xs"
              />
              <input
                type="text"
                value={it.caption ?? ""}
                placeholder="Caption (optional)"
                aria-label={`Image ${i + 1} caption`}
                onChange={(e) => update(i, { caption: e.target.value })}
                className="form-control text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="cursor-pointer text-xs font-medium text-brand-green hover:underline">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingIndex === i}
                onChange={(e) => {
                  void upload(i, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              {uploadingIndex === i ? "Uploading…" : "Upload from device"}
            </label>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="ti-btn ti-btn-light ti-btn-sm w-full">
        + Add image
      </button>
    </div>
  );
}

/** Swap the image in the slot clicked in the preview. Works for any template
 *  image (hero, services, about, gallery, testimonials) — the slot resolves to a
 *  content path and the change flows into the live preview. */
export function ImageSlotPanel() {
  const config = useSiteEditorStore((s) => s.config);
  const slot = useSiteEditorStore((s) => s.selectedImageSlot);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const path = slot ? imageSlotToContentPath(slot) : null;
  if (!config || !slot || !path) return null;

  const current = contentValueAt(config.content, path);
  const setImage = (value: string) => dispatch(contentPathToPatch(path, value), `Image ${slot}`);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Image is too large (max 10 MB). Use a smaller file or paste a URL.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadSiteImage(config.siteId, file, {
        assetType: assetTypeForSlot(slot),
        slotKey: slot,
      });
      setImage(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Try again or paste a URL.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-textmuted">Image</h3>
      <p className="text-xs text-textmuted">
        Editing <span className="font-mono">{slot}</span>
      </p>
      <div
        className="h-24 w-full rounded border border-defaultborder bg-light bg-cover bg-center"
        style={current ? { backgroundImage: `url("${current}")` } : undefined}
        aria-hidden
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <label className="ti-btn ti-btn-light ti-btn-sm w-full cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {uploading ? "Uploading…" : "Upload from device"}
      </label>
      <input
        type="url"
        {...urlFieldProps(current)}
        aria-label="Image URL"
        onChange={(e) => setImage(e.target.value)}
        className="form-control text-xs"
      />
    </div>
  );
}

export { SECTION_LABELS };
