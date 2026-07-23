"use client";

import { SITES_BASE, SitesApiError } from "@/lib/sites-api";

export const TOKEN_EXHAUSTED_MESSAGE =
  "You have exhausted your free tokens. Please recharge to continue.";

type GenerationErrorBubbleProps = {
  error: SitesApiError;
  usedFallback?: boolean;
  onRetry?: () => void;
};

function formatModerationMessage(moderation: unknown): string {
  if (!moderation || typeof moderation !== "object") return "Content was blocked by moderation.";
  const message = (moderation as { message?: string }).message;
  return message?.trim() || "Content was blocked by moderation.";
}

export function GenerationErrorBubble({ error, usedFallback, onRetry }: GenerationErrorBubbleProps) {
  if (usedFallback) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="m-0 font-medium">Generated a starter version — want me to refine it?</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="ti-btn ti-btn-light ti-btn-sm mt-3">
            Try a full generation
          </button>
        ) : null}
      </div>
    );
  }

  if (error.status === 402) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
        <p className="m-0 font-medium">{TOKEN_EXHAUSTED_MESSAGE}</p>
        <a
          href={`${SITES_BASE}/api/token-packs`}
          className="mt-2 inline-block text-sm font-medium text-rose-700 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Recharge tokens
        </a>
      </div>
    );
  }

  if (error.status === 403) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
        <p className="m-0 font-medium">{formatModerationMessage(error.moderation ?? error.detail)}</p>
      </div>
    );
  }

  if (error.status === 429) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="m-0 font-medium">Too many requests, retry in a moment.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950">
      <p className="m-0 font-medium">{error.message}</p>
    </div>
  );
}

export function generationErrorMessage(error: SitesApiError, usedFallback?: boolean): string {
  if (usedFallback) {
    return "Generated a starter version — want me to refine it?";
  }
  if (error.status === 402) {
    return TOKEN_EXHAUSTED_MESSAGE;
  }
  if (error.status === 403) {
    return formatModerationMessage(error.moderation ?? error.detail);
  }
  if (error.status === 429) {
    return "Too many requests, retry in a moment.";
  }
  if (error.status === 422) {
    const detail = String(error.detail ?? error.message ?? "");
    if (/cta_preference|invalid_value/i.test(detail)) {
      return "Please reply with one of: WhatsApp, phone call, or contact form.";
    }
    if (/business_name/i.test(detail)) {
      return "Please share your business name — just the name customers would recognize.";
    }
    return "That answer didn't look right — please try again with a short, plain answer.";
  }
  return error.message;
}
