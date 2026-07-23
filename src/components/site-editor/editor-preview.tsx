"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SiteContent } from "@/templates/system/types";
import type { SectionKey } from "@/templates/system/types";
import { BaseTemplate } from "@/templates/BaseTemplate";
import { SiteRenderer, type LaunchTemplateId } from "@/templates/launch/SiteRenderer";
import type { TemplateId } from "@/templates/packages";
import { brandNameFromConfig, isLaunchTemplateId, imageSlotToContentPath } from "@/lib/site-config";
import { contentPathToPatch } from "@/lib/json-patch";
import { useSiteEditorStore } from "@/store/site-editor-store";

/** Map data-element-key → JSON content path for inline text edits. */
const ELEMENT_CONTENT_PATHS: Record<string, string> = {
  "hero.headline": "hero.headline",
  "hero.subtext": "hero.subtext",
  "hero.cta_button": "hero.cta_text",
  "about.section_title": "about.section_title",
  "about.body": "about.body",
  "why_us.section_title": "why_us.section_title",
  "gallery.section_title": "gallery.section_title",
  "testimonials.section_title": "testimonials.section_title",
  "pricing.section_title": "pricing.section_title",
  "faq.section_title": "faq.section_title",
  "contact.section_title": "contact.section_title",
  "cta_footer.headline": "cta_footer.headline",
  "cta_footer.cta_button": "cta_footer.cta_text",
};

function isTextEditableElement(el: HTMLElement): boolean {
  const key = el.getAttribute("data-element-key");
  if (!key) return false;
  if (ELEMENT_CONTENT_PATHS[key]) return true;
  // list items: services.items[0].title etc — allow if key matches known prefixes
  return /^(services|testimonials|pricing|faq|gallery|why_us)\./.test(key);
}

function elementKeyToContentPath(key: string): string | null {
  if (ELEMENT_CONTENT_PATHS[key]) return ELEMENT_CONTENT_PATHS[key];
  if (key === "brand.name") return null;
  if (/^(services|testimonials|pricing|faq|gallery|why_us|contact|hero|about|cta_footer)\./.test(key)) {
    return key;
  }
  return null;
}

export function EditorPreview() {
  const config = useSiteEditorStore((s) => s.config);
  const aiProposal = useSiteEditorStore((s) => s.aiProposal);
  const selectedSection = useSiteEditorStore((s) => s.selectedSection);
  const selectedElementKey = useSiteEditorStore((s) => s.selectedElementKey);
  const selectedImageSlot = useSiteEditorStore((s) => s.selectedImageSlot);
  const setSelectedSection = useSiteEditorStore((s) => s.setSelectedSection);
  const setSelectedElement = useSiteEditorStore((s) => s.setSelectedElement);
  const setSelectedImageSlot = useSiteEditorStore((s) => s.setSelectedImageSlot);
  const setPreviewCaps = useSiteEditorStore((s) => s.setPreviewCaps);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      // BaseTemplate exposes data-section-key (editorMode); launch templates
      // (all web-agent sites) expose data-section on each <section>. Accept both.
      const sectionEl = target.closest("[data-section-key],[data-section]") as HTMLElement | null;
      if (sectionEl) {
        const key =
          sectionEl.getAttribute("data-section-key") ?? sectionEl.getAttribute("data-section");
        if (key) setSelectedSection(key as SectionKey);
      }
      // Image slots win over text-element selection so clicking a photo opens
      // the image swapper. Only editable slots (mapped to a content path) qualify;
      // design furniture (clock/coaches) is ignored and falls through.
      const slotEl = target.closest("[data-image-slot]") as HTMLElement | null;
      const slot = slotEl?.getAttribute("data-image-slot") ?? null;
      if (slot && imageSlotToContentPath(slot)) {
        setSelectedImageSlot(slot);
        return;
      }
      const elementEl = target.closest("[data-element-key]") as HTMLElement | null;
      if (elementEl) {
        setSelectedElement(elementEl.getAttribute("data-element-key"));
      }
    },
    [setSelectedSection, setSelectedElement, setSelectedImageSlot],
  );

  // Probe what the rendered template actually supports so the sidebar can hide
  // dead controls. Runs on config change (not selection) since capabilities are
  // a property of the template, not the selection. A launch <section data-section>
  // that carries inline sectionStyle padding honors the frame controls; a bespoke
  // hardcoded one (className only) does not. Gallery is editable only when it
  // renders real gallery.items image slots.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const galleryImages = root.querySelector('[data-image-slot^="gallery.items"]') !== null;
    const frameFixedSections: string[] = [];
    root.querySelectorAll("section[data-section]").forEach((node) => {
      const el = node as HTMLElement;
      const key = el.getAttribute("data-section");
      if (key && !el.style.padding) frameFixedSections.push(key);
    });
    setPreviewCaps({ galleryImages, frameFixedSections });
  }, [config, setPreviewCaps]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !config) return;

    const onBlur = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el.isContentEditable) return;
      const key = el.getAttribute("data-element-key");
      if (!key) return;
      const path = elementKeyToContentPath(key);
      if (!path) return;
      const text = el.innerText.trim();
      dispatch(contentPathToPatch(path, text), `Edit ${key}`);
    };

    root.addEventListener("blur", onBlur, true);
    return () => root.removeEventListener("blur", onBlur, true);
  }, [config, dispatch]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll("[data-element-key]").forEach((node) => {
      const el = node as HTMLElement;
      const key = el.getAttribute("data-element-key");
      const selected = key === selectedElementKey;
      el.style.outline = selected ? "2px dashed #41a454" : "";
      el.style.outlineOffset = selected ? "2px" : "";
      if (isTextEditableElement(el)) {
        el.contentEditable = selected ? "true" : "false";
        el.spellcheck = false;
      }
    });
    // Selected-section outline for launch templates (BaseTemplate draws its own
    // via editorMode and uses data-section-key, so it is untouched here).
    root.querySelectorAll("[data-section]").forEach((node) => {
      const el = node as HTMLElement;
      const selected = el.getAttribute("data-section") === selectedSection;
      el.style.outline = selected ? "2px solid #41a454" : "";
      el.style.outlineOffset = selected ? "2px" : "";
    });
    // Image slots: outline the selected one, and show a pointer on editable slots.
    root.querySelectorAll("[data-image-slot]").forEach((node) => {
      const el = node as HTMLElement;
      const slot = el.getAttribute("data-image-slot");
      const editable = !!slot && imageSlotToContentPath(slot) !== null;
      el.style.cursor = editable ? "pointer" : "";
      const selected = slot === selectedImageSlot;
      el.style.outline = selected ? "2px dashed #41a454" : editable ? "" : el.style.outline;
      el.style.outlineOffset = selected ? "2px" : el.style.outlineOffset;
    });
  }, [config, selectedElementKey, selectedSection, selectedImageSlot]);

  if (!config) return null;

  const previewContent =
    aiProposal && aiProposal.sectionKey in config.content
      ? { ...config.content, [aiProposal.sectionKey]: aiProposal.content }
      : config.content;

  const brandName = brandNameFromConfig(config);

  if (isLaunchTemplateId(config.templateId)) {
    return (
      <div ref={rootRef} onClick={handleClick} className="site-editor-preview">
        <SiteRenderer
          templateId={config.templateId as LaunchTemplateId}
          content={previewContent as SiteContent}
          theme={config.theme}
          brandName={brandName}
        />
      </div>
    );
  }

  return (
    <div ref={rootRef} onClick={handleClick} className="site-editor-preview">
      <BaseTemplate
        templateId={config.templateId as TemplateId}
        content={previewContent as typeof config.content}
        theme={config.theme}
        brandName={brandName}
        editor={{
          editorMode: true,
          selectedSection,
          selectedElementKey,
        }}
      />
    </div>
  );
}
