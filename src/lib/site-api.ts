import type {
  CategoryRecord,
  PublishChecklistItem,
  SiteGenerateResult,
  SitePublishResult,
  SiteRecord,
  SiteSectionMutationResult,
  TokenTransaction,
} from "@/lib/site-types";
import { getToken, handleUnauthorized } from "@/lib/auth";
import { BASE, BuilderApiError } from "@/lib/builder-api";

export { BuilderApiError as SiteApiError };

const REQUEST_TIMEOUT_MS = 35000;
const GENERATION_TIMEOUT_MS = 90000;

function idempotencyKey(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function siteFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const token = getToken();
  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...((init?.headers as Record<string, string>) ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: controller.signal,
  };
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, mergedInit);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new BuilderApiError(`API timeout: ${path}`, 408);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
  if (res.status === 401) {
    if (token) handleUnauthorized();
    throw new BuilderApiError(`API 401: ${path} - session expired`, 401);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const payload = await res.json();
      if (typeof payload?.detail === "string") detail = payload.detail;
      else if (payload?.detail) detail = JSON.stringify(payload.detail);
    } catch {
      try {
        detail = await res.text();
      } catch {
        detail = "";
      }
    }
    const suffix = detail ? ` - ${detail}` : "";
    throw new BuilderApiError(`API ${res.status}: ${path}${suffix}`, res.status);
  }
  return res.json() as Promise<T>;
}

export async function listCategories(): Promise<CategoryRecord[]> {
  return siteFetch("/categories");
}

export async function getTokenBalance(): Promise<{ balance: number }> {
  if (!getToken()) return { balance: 0 };
  return siteFetch("/tokens/balance");
}

export async function listTokenTransactions(): Promise<{ transactions: TokenTransaction[] }> {
  if (!getToken()) return { transactions: [] };
  return siteFetch("/tokens/transactions");
}

/** Charge `cost` tokens for site-editor changes; returns the new balance. */
export async function spendTokens(
  cost: number,
  siteId?: string,
): Promise<{ balance: number; charged: number }> {
  return siteFetch("/tokens/spend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cost, siteId, idempotencyKey: idempotencyKey("site-edit") }),
  });
}

export async function listSites(): Promise<SiteRecord[]> {
  if (!getToken()) return [];
  return siteFetch("/sites");
}

export async function getSite(siteId: string): Promise<SiteRecord> {
  return siteFetch(`/sites/${encodeURIComponent(siteId)}`);
}

export async function createSite(body: {
  businessProfileJson?: Record<string, unknown>;
  templateId?: string | null;
  subdomain?: string | null;
}): Promise<SiteRecord> {
  return siteFetch("/sites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateSite(
  siteId: string,
  body: Partial<
    Pick<
      SiteRecord,
      | "templateId"
      | "templateVersion"
      | "businessProfileJson"
      | "contentJson"
      | "themeJson"
      | "status"
      | "subdomain"
      | "customDomain"
    >
  >,
): Promise<SiteRecord> {
  return siteFetch(`/sites/${encodeURIComponent(siteId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function deleteSite(siteId: string): Promise<{ status: string }> {
  return siteFetch(`/sites/${encodeURIComponent(siteId)}`, { method: "DELETE" });
}

export async function generateSiteContent(
  siteId: string,
  sectionSchema: Record<string, unknown>,
  idempotencyKeyValue?: string,
): Promise<SiteGenerateResult> {
  return siteFetch(
    `/sites/${encodeURIComponent(siteId)}/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionSchema,
        idempotencyKey: idempotencyKeyValue ?? idempotencyKey("gen"),
      }),
    },
    GENERATION_TIMEOUT_MS,
  );
}

export async function getPublishChecklist(
  siteId: string,
): Promise<{ checklist: PublishChecklistItem[] }> {
  return siteFetch(`/sites/${encodeURIComponent(siteId)}/publish`);
}

export async function publishSite(siteId: string): Promise<SitePublishResult> {
  return siteFetch(`/sites/${encodeURIComponent(siteId)}/publish`, { method: "POST" });
}

export async function regenerateSiteSection(
  siteId: string,
  sectionKey: string,
  options?: { instruction?: string; idempotencyKey?: string },
): Promise<SiteSectionMutationResult> {
  return siteFetch(
    `/sites/${encodeURIComponent(siteId)}/sections/${encodeURIComponent(sectionKey)}/regenerate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: options?.idempotencyKey ?? idempotencyKey("regen"),
        instruction: options?.instruction,
      }),
    },
    GENERATION_TIMEOUT_MS,
  );
}

export async function rewriteSiteSection(
  siteId: string,
  sectionKey: string,
  instruction: string,
  idempotencyKeyValue?: string,
): Promise<SiteSectionMutationResult> {
  return siteFetch(
    `/sites/${encodeURIComponent(siteId)}/sections/${encodeURIComponent(sectionKey)}/rewrite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction,
        idempotencyKey: idempotencyKeyValue ?? idempotencyKey("rewrite"),
      }),
    },
    GENERATION_TIMEOUT_MS,
  );
}
