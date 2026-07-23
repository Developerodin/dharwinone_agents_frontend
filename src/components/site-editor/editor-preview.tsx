"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SiteContent } from "@/templates/system/types";
import type { SectionKey } from "@/templates/system/types";
import { BaseTemplate } from "@/templates/BaseTemplate";
import { SiteRenderer, type LaunchTemplateId } from "@/templates/launch/SiteRenderer";
import type { TemplateId } from "@/templates/packages";
import { brandNameFromConfig, isLaunchTemplateId } from "@/lib/site-config";
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
  const setSelectedSection = useSiteEditorStore((s) => s.setSelectedSection);
  const setSelectedElement = useSiteEditorStore((s) => s.setSelectedElement);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  const rootRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const sectionEl = target.closest("[data-section-key]") as HTMLElement | null;
      if (sectionEl) {
        setSelectedSection(sectionEl.getAttribute("data-section-key") as SectionKey);
      }
      const elementEl = target.closest("[data-element-key]") as HTMLElement | null;
      if (elementEl) {
        setSelectedElement(elementEl.getAttribute("data-element-key"));
      }
    },
    [setSelectedSection, setSelectedElement],
  );

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
  }, [config, selectedElementKey, selectedSection]);

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
