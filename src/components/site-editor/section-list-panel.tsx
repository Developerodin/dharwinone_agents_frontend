"use client";

import { useCallback, useRef, useState } from "react";
import type { SectionKey } from "@/templates/system/types";
import { SECTION_LABELS } from "@/components/site-editor/section-panels";
import { getRenderedSectionKeys } from "@/templates/launch/registry";
import { useSiteEditorStore } from "@/store/site-editor-store";

export function SectionListPanel() {
  const config = useSiteEditorStore((s) => s.config);
  const selectedSection = useSiteEditorStore((s) => s.selectedSection);
  const setSelectedSection = useSiteEditorStore((s) => s.setSelectedSection);
  const dispatch = useSiteEditorStore((s) => s.dispatch);
  const dragKey = useRef<SectionKey | null>(null);
  const [dragOver, setDragOver] = useState<SectionKey | null>(null);

  const reorder = useCallback(
    (from: SectionKey, to: SectionKey) => {
      if (!config || from === to) return;
      const order = [...config.theme.sectionOrder];
      const fromIdx = order.indexOf(from);
      const toIdx = order.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, from);
      dispatch([{ op: "replace", path: "/theme/sectionOrder", value: order }], "Reorder sections");
    },
    [config, dispatch],
  );

  const toggleHidden = (key: SectionKey) => {
    if (!config) return;
    const hidden = new Set(config.theme.hiddenSections);
    const willHide = !hidden.has(key);
    if (willHide) hidden.add(key);
    else hidden.delete(key);
    dispatch(
      [{ op: "replace", path: "/theme/hiddenSections", value: [...hidden] }],
      willHide ? `Hide ${key}` : `Show ${key}`,
    );
  };

  if (!config) return null;
  const hidden = new Set(config.theme.hiddenSections);
  // Only list sections the template actually renders (null = unknown template → show all).
  const rendered = getRenderedSectionKeys(config.templateId);
  const sectionKeys = rendered
    ? config.theme.sectionOrder.filter((k) => rendered.includes(k))
    : config.theme.sectionOrder;

  return (
    <div className="space-y-1">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-textmuted">Sections</h3>
      {sectionKeys.map((key) => {
        const isHidden = hidden.has(key);
        const active = selectedSection === key;
        return (
          <div
            key={key}
            draggable
            onDragStart={() => {
              dragKey.current = key;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(key);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => {
              if (dragKey.current) reorder(dragKey.current, key);
              dragKey.current = null;
              setDragOver(null);
            }}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
              dragOver === key ? "border-brand-green bg-brand-green/5" : "border-defaultborder"
            } ${active ? "ring-1 ring-brand-green" : ""} ${isHidden ? "opacity-50" : ""}`}
          >
            <span className="cursor-grab text-textmuted" aria-hidden>
              ⋮⋮
            </span>
            <button
              type="button"
              className="flex-1 text-left text-xs font-medium"
              onClick={() => setSelectedSection(key)}
            >
              {SECTION_LABELS[key]}
            </button>
            <button
              type="button"
              className="text-[10px] font-medium uppercase text-textmuted hover:text-defaulttextcolor"
              onClick={() => toggleHidden(key)}
            >
              {isHidden ? "Show" : "Hide"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
