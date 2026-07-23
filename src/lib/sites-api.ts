import { getToken, handleUnauthorized } from "@/lib/auth";
import type {
  FollowUp,
  PublishResult,
  SiteDoc,
  SiteVersionSummary,
  TemplateMatch,
} from "@/lib/sites-types";

export const SITES_BASE = (
  process.env.NEXT_PUBLIC_SITES_API ??
  process.env.NEXT_PUBLIC_STUDIO_API ??
  "http://127.0.0.1:8787"
).trim();

const REQUEST_TIMEOUT_MS = 35_000;
const GENERATION_TIMEOUT_MS = 240_000;

export class SitesApiError extends Error {
  status: number;
  detail: unknown;
  balance?: number;
  cost?: number;
  moderation?: unknown;

  constructor(status: number, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.name = "SitesApiError";
    this.status = status;
    this.detail = body.detail ?? message;
    if (typeof body.balance === "number") this.balance = body.balance;
    if (typeof body.cost === "number") this.cost = body.cost;
    if (body.moderation !== undefined) this.moderation = body.moderation;
  }
}

async function sitesFetch<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const token = getToken();
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  if (init?.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(`${SITES_BASE}${path}`, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new SitesApiError(408, `API timeout: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 401) {
    if (token) handleUnauthorized();
    throw new SitesApiError(401, `API 401: ${path} - session expired`);
  }

  let body: Record<string, unknown> = {};
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      body = { detail: text };
    }
  }

  if (!res.ok) {
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : body.detail
          ? JSON.stringify(body.detail)
          : `Request failed (${res.status})`;
    throw new SitesApiError(res.status, detail, body);
  }

  return body as T;
}

export async function prefillIntake(body: {
  description: string;
  category: string;
  subcategory?: string;
}): Promise<{ businessProfile: Record<string, unknown>; source: string }> {
  return sitesFetch("/api/sites/intake/prefill", {
    method: "POST",
    body: JSON.stringify({
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
    }),
  });
}

export async function gapCheck(body: {
  businessProfile: Record<string, unknown>;
  categoryId: string;
}): Promise<{ complete: boolean; followUps: FollowUp[] }> {
  return sitesFetch("/api/sites/intake/gap-check", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createSite(body: {
  businessProfileJson: Record<string, unknown>;
  templateId?: string | null;
  subdomain?: string | null;
}): Promise<SiteDoc> {
  return sitesFetch("/api/sites", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function listSites(): Promise<SiteDoc[]> {
  if (!getToken()) return [];
  return sitesFetch<SiteDoc[]>("/api/sites");
}

export async function deleteSite(siteId: string): Promise<{ status: string }> {
  return sitesFetch(`/api/sites/${encodeURIComponent(siteId)}`, { method: "DELETE" });
}

export async function matchTemplates(body: {
  businessProfile: Record<string, unknown>;
}): Promise<{ matches: TemplateMatch[] }> {
  return sitesFetch("/api/templates/match", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getTemplateSchema(
  templateId: string,
): Promise<{ sections: string[]; schema: Record<string, unknown> }> {
  const payload = await sitesFetch<{ templates: Array<{ id: string; section_schema: Record<string, unknown> }> }>(
    "/api/templates",
  );
  const template = payload.templates?.find((row) => row.id === templateId);
  if (!template) {
    throw new SitesApiError(404, `template not found: ${templateId}`);
  }
  const schema = template.section_schema ?? {};
  const sections =
    Array.isArray((schema as { sections?: string[] }).sections) &&
    (schema as { sections?: string[] }).sections?.length
      ? ((schema as { sections: string[] }).sections as string[])
      : ["hero", "services", "why_us", "testimonials", "cta_footer"];
  return { sections, schema };
}

export async function generateSite(
  siteId: string,
  body: { sectionSchema: Record<string, unknown>; idempotencyKey: string },
): Promise<{ site: SiteDoc; usedFallback: boolean; cost: number }> {
  return sitesFetch(
    `/api/sites/${encodeURIComponent(siteId)}/generate`,
    {
      method: "POST",
      body: JSON.stringify({
        sectionSchema: body.sectionSchema,
        idempotencyKey: body.idempotencyKey,
      }),
    },
    GENERATION_TIMEOUT_MS,
  );
}

export async function rewriteSection(
  siteId: string,
  sectionKey: string,
  body: { instruction: string; idempotencyKey: string },
): Promise<{ site: SiteDoc; section: unknown; cost: number }> {
  return sitesFetch(
    `/api/sites/${encodeURIComponent(siteId)}/sections/${encodeURIComponent(sectionKey)}/rewrite`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    GENERATION_TIMEOUT_MS,
  );
}

export async function regenerateSection(
  siteId: string,
  sectionKey: string,
  body: { idempotencyKey: string; instruction?: string },
): Promise<{ site: SiteDoc; section: unknown; cost: number }> {
  return sitesFetch(
    `/api/sites/${encodeURIComponent(siteId)}/sections/${encodeURIComponent(sectionKey)}/regenerate`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    GENERATION_TIMEOUT_MS,
  );
}

export async function getSite(siteId: string): Promise<SiteDoc> {
  return sitesFetch(`/api/sites/${encodeURIComponent(siteId)}`);
}

export async function patchSite(
  siteId: string,
  body: Partial<{
    themeJson: Record<string, unknown>;
    contentJson: Record<string, unknown>;
    subdomain: string;
    status: string;
    templateId: string;
  }>,
): Promise<SiteDoc> {
  return sitesFetch(`/api/sites/${encodeURIComponent(siteId)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** Upload an image to the site's real asset store: presign → PUT to S3 → confirm.
 *  Returns the public URL to store in the site config (replaces inline base64).
 *  `assetType` must be one of the backend's allowed types (logo/brand/service/
 *  team/product); `slotKey` traces the upload to the content slot it fills. */
export async function uploadSiteImage(
  siteId: string,
  file: File,
  opts: { assetType: string; slotKey?: string },
): Promise<string> {
  const base = `/api/sites/${encodeURIComponent(siteId)}/assets`;
  const presign = await sitesFetch<{
    assetId: string;
    s3Key: string;
    uploadUrl: string;
    method: string;
    headers: Record<string, string>;
  }>(`${base}/presign`, {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      assetType: opts.assetType,
      slotKey: opts.slotKey,
    }),
  });

  // Direct-to-S3 PUT — raw fetch, not sitesFetch (no auth header, and the
  // Content-Type must exactly match what the URL was signed with).
  const put = await fetch(presign.uploadUrl, {
    method: presign.method || "PUT",
    headers: presign.headers,
    body: file,
  });
  if (!put.ok) throw new SitesApiError(put.status, `image upload failed (${put.status})`);

  const confirmed = await sitesFetch<{ publicUrl?: string }>(`${base}/confirm`, {
    method: "POST",
    body: JSON.stringify({
      assetId: presign.assetId,
      s3Key: presign.s3Key,
      contentType: file.type,
      sizeBytes: file.size,
      slotKey: opts.slotKey,
      assetType: opts.assetType,
    }),
  });
  if (!confirmed.publicUrl) {
    throw new SitesApiError(500, "upload confirmed but no public URL was returned");
  }
  return confirmed.publicUrl;
}

export async function publishSite(siteId: string): Promise<PublishResult> {
  return sitesFetch(`/api/sites/${encodeURIComponent(siteId)}/publish`, {
    method: "POST",
  });
}

export async function listVersions(siteId: string): Promise<SiteVersionSummary[]> {
  return sitesFetch(`/api/sites/${encodeURIComponent(siteId)}/versions`);
}

export async function restoreVersion(
  siteId: string,
  versionId: string,
): Promise<{ site: SiteDoc }> {
  return sitesFetch(`/api/sites/${encodeURIComponent(siteId)}/versions/restore`, {
    method: "POST",
    body: JSON.stringify({ versionId }),
  });
}

export async function getTokenBalance(): Promise<{ balance: number }> {
  if (!getToken()) return { balance: 0 };
  return sitesFetch("/api/tokens/balance");
}

export async function listCategories(): Promise<
  Array<{
    categoryId: string;
    name: string;
    keywordsJson?: string[];
    subcategoriesJson?: Array<{ id: string; name: string; keywords?: string[] }>;
  }>
> {
  return sitesFetch("/api/categories");
}

export async function getTemplateStyleTags(
  templateId: string,
): Promise<string[] | undefined> {
  const payload = await sitesFetch<{
    templates: Array<{ id: string; style_tags?: string[] }>;
  }>("/api/templates");
  return payload.templates?.find((row) => row.id === templateId)?.style_tags;
}
