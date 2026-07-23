"use client";

import type { SectionKey, SectionOverride } from "@/templates/system/types";
import { ContrastWarning } from "@/components/site-editor/contrast-warning";
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
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  if (!config || !selectedSection) {
    return (
      <p className="text-xs text-textmuted">Select a section in the preview or list to edit its style.</p>
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
      <h3 className="text-sm font-semibold text-defaulttextcolor">{SECTION_LABELS[selectedSection]}</h3>
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

export { SECTION_LABELS };
