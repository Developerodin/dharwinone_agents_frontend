"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ROUTES } from "@/lib/constants";
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
import { TOKEN_EXHAUSTED_MESSAGE } from "@/components/web-agent/sites/GenerationErrorBubble";
import { useTokenBalance } from "@/hooks/use-token-balance";
import { SiteApiError, spendTokens, updateSite } from "@/lib/site-api";
import { brandNameFromConfig, configToSitePatch } from "@/lib/site-config";
import { TOKEN_COSTS } from "@/lib/site-types";
import { useSiteEditorStore } from "@/store/site-editor-store";

const SAVE_LABEL: Record<string, string> = {
  idle: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Save failed",
};

type SiteEditorShellProps = {
  siteId: string;
};

export function SiteEditorShell({ siteId }: SiteEditorShellProps) {
  const config = useSiteEditorStore((s) => s.config);
  const device = useSiteEditorStore((s) => s.device);
  const setDevice = useSiteEditorStore((s) => s.setDevice);
  const saveStatus = useSiteEditorStore((s) => s.saveStatus);
  const setSaveStatus = useSiteEditorStore((s) => s.setSaveStatus);
  const undo = useSiteEditorStore((s) => s.undo);
  const redo = useSiteEditorStore((s) => s.redo);
  const canUndo = useSiteEditorStore((s) => s.canUndo());
  const canRedo = useSiteEditorStore((s) => s.canRedo());
  const unbilledChangeCount = useSiteEditorStore((s) => s.unbilledChangeCount());
  const markChangesBilled = useSiteEditorStore((s) => s.markChangesBilled);
  const { balance, refresh } = useTokenBalance();
  const [rewritePending, setRewritePending] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);

  const handleRewrite = useCallback(async () => {
    const current = useSiteEditorStore.getState().config;
    if (!current) return;

    const newChanges = useSiteEditorStore.getState().unbilledChangeCount();
    const tokenCost = newChanges * TOKEN_COSTS.ai_rewrite;

    setRewritePending(true);
    setRewriteError(null);
    setSaveStatus("saving");

    try {
      if (tokenCost > 0) {
        await spendTokens(tokenCost, current.siteId);
      }
      await updateSite(current.siteId, configToSitePatch(current));
      markChangesBilled();
      setSaveStatus("saved");
      await refresh();
    } catch (err) {
      setSaveStatus("error");
      if (err instanceof SiteApiError && err.status === 402) {
        setRewriteError(TOKEN_EXHAUSTED_MESSAGE);
      } else {
        setRewriteError(err instanceof Error ? err.message : "Could not save changes");
      }
    } finally {
      setRewritePending(false);
    }
  }, [markChangesBilled, refresh, setSaveStatus]);

  if (!config) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-textmuted">
        Loading site…
      </div>
    );
  }

  const title = brandNameFromConfig(config);
  const rewriteCost = unbilledChangeCount * TOKEN_COSTS.ai_rewrite;
  const rewriteLabel =
    rewriteCost > 0 ? `Rewrite (${rewriteCost} tokens)` : "Rewrite";

  return (
    <div className="flex h-screen flex-col bg-bodybg">
      <header className="flex flex-wrap items-center gap-3 border-b border-defaultborder bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-textmuted">Site editor</p>
          <h1 className="truncate text-lg font-semibold text-defaulttextcolor">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {balance !== null ? (
            <span
              className="inline-flex items-center rounded-full border border-defaultborder/70 bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#334155]"
              title="Token balance"
            >
              {balance.toLocaleString()} tokens
            </span>
          ) : null}
          <button type="button" className="ti-btn ti-btn-light ti-btn-sm" disabled={!canUndo} onClick={undo}>
            Undo
          </button>
          <button type="button" className="ti-btn ti-btn-light ti-btn-sm" disabled={!canRedo} onClick={redo}>
            Redo
          </button>
          <DeviceToggle device={device} onChange={setDevice} />
          <span className="text-xs text-textmuted">{SAVE_LABEL[saveStatus] ?? saveStatus}</span>
          <button
            type="button"
            className="ti-btn ti-btn-primary ti-btn-sm"
            disabled={rewritePending || saveStatus === "idle"}
            onClick={() => void handleRewrite()}
          >
            {rewritePending ? "Saving…" : rewriteLabel}
          </button>
          <Link
            href={`${ROUTES.webAgent}?project=${encodeURIComponent(siteId)}`}
            className="ti-btn ti-btn-outline-primary ti-btn-sm"
          >
            Exit
          </Link>
        </div>
      </header>
      {rewriteError ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-950">
          {rewriteError}
        </div>
      ) : null}
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
      <style jsx global>{`
        .site-editor-section-toolbar {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 20;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        [data-section-key]:hover .site-editor-section-toolbar,
        [data-section]:hover .site-editor-section-toolbar,
        .site-editor-section-toolbar:has(.site-editor-section-edit-btn[aria-pressed="true"]) {
          opacity: 1;
          pointer-events: auto;
        }
        .site-editor-section-edit-btn {
          border: 1px solid rgba(65, 164, 84, 0.35);
          background: #ffffff;
          color: #1f7a3a;
          border-radius: 9999px;
          padding: 0.25rem 0.75rem;
          font-size: 0.75rem;
          font-weight: 600;
          line-height: 1.25rem;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
          cursor: pointer;
        }
        .site-editor-section-edit-btn[aria-pressed="true"] {
          background: #41a454;
          border-color: #41a454;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}
