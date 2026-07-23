"use client";

import Link from "next/link";
import { DevicePreviewFrame, DeviceToggle } from "@/components/site-editor/device-preview";
import { EditorPreview } from "@/components/site-editor/editor-preview";
import { SectionListPanel } from "@/components/site-editor/section-list-panel";
import { PalettePanel, BrandColorsPanel } from "@/components/site-editor/style-panels";
import {
  SectionStylePanel,
  ElementOverridePanel,
  GalleryImagesPanel,
  ImageSlotPanel,
} from "@/components/site-editor/section-panels";
import { AiActionPanel } from "@/components/site-editor/ai-action-panel";
import { useSiteEditorStore } from "@/store/site-editor-store";
import { brandNameFromConfig } from "@/lib/site-config";

const SAVE_LABEL: Record<string, string> = {
  idle: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

export function SiteEditorShell() {
  const config = useSiteEditorStore((s) => s.config);
  const device = useSiteEditorStore((s) => s.device);
  const setDevice = useSiteEditorStore((s) => s.setDevice);
  const saveStatus = useSiteEditorStore((s) => s.saveStatus);
  const undo = useSiteEditorStore((s) => s.undo);
  const redo = useSiteEditorStore((s) => s.redo);
  const canUndo = useSiteEditorStore((s) => s.canUndo());
  const canRedo = useSiteEditorStore((s) => s.canRedo());

  if (!config) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-textmuted">
        Loading site…
      </div>
    );
  }

  const title = brandNameFromConfig(config);

  return (
    <div className="flex h-screen flex-col bg-bodybg">
      <header className="flex flex-wrap items-center gap-3 border-b border-defaultborder bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-textmuted">Site editor</p>
          <h1 className="truncate text-lg font-semibold text-defaulttextcolor">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="ti-btn ti-btn-light ti-btn-sm" disabled={!canUndo} onClick={undo}>
            Undo
          </button>
          <button type="button" className="ti-btn ti-btn-light ti-btn-sm" disabled={!canRedo} onClick={redo}>
            Redo
          </button>
          <DeviceToggle device={device} onChange={setDevice} />
          <span className="text-xs text-textmuted">{SAVE_LABEL[saveStatus] ?? saveStatus}</span>
          <Link href="/web-agent" className="ti-btn ti-btn-outline-primary ti-btn-sm">
            Exit
          </Link>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[280px] shrink-0 overflow-y-auto border-r border-defaultborder bg-white p-4">
          <SectionListPanel />
          <div className="my-4 border-t border-defaultborder" />
          <PalettePanel />
          <div className="my-4 border-t border-defaultborder" />
          <BrandColorsPanel />
          <div className="my-4 border-t border-defaultborder" />
          <SectionStylePanel />
          <GalleryImagesPanel />
          <ImageSlotPanel />
          <div className="my-4 border-t border-defaultborder" />
          <ElementOverridePanel />
          <AiActionPanel />
        </aside>
        <DevicePreviewFrame device={device}>
          <EditorPreview />
        </DevicePreviewFrame>
      </div>
    </div>
  );
}
