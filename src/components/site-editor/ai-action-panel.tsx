"use client";

import { useState } from "react";
import { regenerateSiteSection, rewriteSiteSection } from "@/lib/site-api";
import { TOKEN_COSTS } from "@/lib/site-types";
import type { SectionKey } from "@/templates/system/types";
import { SECTION_LABELS } from "@/components/site-editor/section-panels";
import { useSiteEditorStore } from "@/store/site-editor-store";
import { useTokenBalance } from "@/hooks/use-token-balance";

export function AiActionPanel() {
  const config = useSiteEditorStore((s) => s.config);
  const selectedSection = useSiteEditorStore((s) => s.selectedSection);
  const setAiProposal = useSiteEditorStore((s) => s.setAiProposal);
  const aiProposal = useSiteEditorStore((s) => s.aiProposal);
  const acceptAiProposal = useSiteEditorStore((s) => s.acceptAiProposal);
  const discardAiProposal = useSiteEditorStore((s) => s.discardAiProposal);
  const { balance, refresh } = useTokenBalance();
  const [instruction, setInstruction] = useState("");
  const [pending, setPending] = useState<"rewrite" | "regenerate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"rewrite" | "regenerate" | null>(null);

  if (!config) return null;
  const section = selectedSection ?? ("hero" as SectionKey);
  const rewriteCost = TOKEN_COSTS.ai_rewrite;
  const regenCost = TOKEN_COSTS.regenerate_section;

  const runAction = async (kind: "rewrite" | "regenerate") => {
    if (!config) return;
    setPending(kind);
    setError(null);
    setConfirmAction(null);
    try {
      const result =
        kind === "rewrite"
          ? await rewriteSiteSection(config.siteId, section, instruction || "Improve clarity and tone.")
          : await regenerateSiteSection(config.siteId, section, { instruction: instruction || undefined });
      setAiProposal({
        sectionKey: section,
        content: result.section,
      });
      void refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI action failed");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-3 border-t border-defaultborder pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-textmuted">AI (metered)</h3>
      <p className="text-xs text-textmuted">
        Section: <strong>{SECTION_LABELS[section]}</strong>
        {balance !== null && <span className="ml-2">Balance: {balance} tokens</span>}
      </p>
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Optional instruction for rewrite / regenerate…"
        className="form-control min-h-[72px] text-xs"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="ti-btn ti-btn-primary ti-btn-sm"
          disabled={!!pending}
          onClick={() => setConfirmAction("rewrite")}
        >
          Rewrite ({rewriteCost} tokens)
        </button>
        <button
          type="button"
          className="ti-btn ti-btn-outline-primary ti-btn-sm"
          disabled={!!pending}
          onClick={() => setConfirmAction("regenerate")}
        >
          Regenerate ({regenCost} tokens)
        </button>
      </div>
      {confirmAction && (
        <div className="rounded-lg border border-warning/40 bg-amber-50 p-3 text-xs">
          <p className="font-medium text-amber-950">
            This will use {confirmAction === "rewrite" ? rewriteCost : regenCost} tokens. Continue?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="ti-btn ti-btn-primary ti-btn-sm"
              onClick={() => void runAction(confirmAction)}
            >
              Confirm
            </button>
            <button type="button" className="ti-btn ti-btn-light ti-btn-sm" onClick={() => setConfirmAction(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {pending && <p className="text-xs text-textmuted">Running {pending}…</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
      {aiProposal && (
        <div className="rounded-lg border border-brand-green/30 bg-brand-green/5 p-3 text-xs">
          <p className="font-medium">AI updated {SECTION_LABELS[aiProposal.sectionKey]}. Accept or discard?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="ti-btn ti-btn-primary ti-btn-sm" onClick={acceptAiProposal}>
              Accept
            </button>
            <button type="button" className="ti-btn ti-btn-light ti-btn-sm" onClick={discardAiProposal}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
