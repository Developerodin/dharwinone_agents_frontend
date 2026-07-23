import { BASE, BuilderApiError } from "@/lib/builder-api";
import { getToken, handleUnauthorized } from "@/lib/auth";
import type {
  IntakeGapCheckRequest,
  IntakeGapCheckResponse,
  IntakeMatchRequest,
  IntakeMatchResponse,
  IntakePrefillRequest,
  IntakePrefillResponse,
  MatchedTemplate,
} from "@/lib/intake-types";
import {
  getCategoryQuestionnaire,
  mapBackendMatches,
  normalizeProfileForApi,
  stubGapCheck,
  stubMatchTemplates,
  stubPrefill,
} from "@/lib/intake-utils";
import type { CategoryRecord } from "@/lib/site-types";
import { listCategories } from "@/lib/site-api";

const REQUEST_TIMEOUT_MS = 35000;

async function intakeFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; stubbed: false } | { stubbed: true }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const token = getToken();

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...((init?.headers as Record<string, string>) ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });

    if (res.status === 401) {
      if (token) handleUnauthorized();
      throw new BuilderApiError(`API 401: ${path}`, 401);
    }

    if (!res.ok) {
      let detail = "";
      try {
        const payload = await res.json();
        detail = typeof payload?.detail === "string" ? payload.detail : JSON.stringify(payload);
      } catch {
        detail = "";
      }
      throw new BuilderApiError(`API ${res.status}: ${path}${detail ? ` - ${detail}` : ""}`, res.status);
    }

    return { data: (await res.json()) as T, stubbed: false };
  } catch (err) {
    if (err instanceof BuilderApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new BuilderApiError(`API timeout: ${path}`, 408);
    }
    return { stubbed: true };
  } finally {
    clearTimeout(timeout);
  }
}

/** POST /sites/intake/prefill */
export async function intakePrefill(
  body: IntakePrefillRequest,
  category?: CategoryRecord | null,
): Promise<IntakePrefillResponse> {
  const result = await intakeFetch<{ businessProfile: Record<string, unknown> }>(
    "/sites/intake/prefill",
    {
      method: "POST",
      body: JSON.stringify({
        description: body.description.trim(),
        category: body.categoryId,
        subcategory: body.subcategoryId || undefined,
      }),
    },
  );

  if (!result.stubbed) {
    return { businessProfile: result.data.businessProfile, stubbed: false };
  }

  const config = getCategoryQuestionnaire(category ?? null);
  return {
    businessProfile: stubPrefill(body, config),
    stubbed: true,
  };
}

/** POST /sites/intake/gap-check */
export async function intakeGapCheck(
  body: IntakeGapCheckRequest,
  category?: CategoryRecord | null,
): Promise<IntakeGapCheckResponse> {
  const result = await intakeFetch<{
    complete: boolean;
    followUps: Array<{ field: string; question: string }>;
  }>("/sites/intake/gap-check", {
    method: "POST",
    body: JSON.stringify({
      categoryId: body.categoryId,
      businessProfile: normalizeProfileForApi(
        body.businessProfile,
        body.categoryId,
        body.subcategoryId,
      ),
    }),
  });

  if (!result.stubbed) {
    const questions = (result.data.followUps ?? []).map((row) => ({
      fieldId: row.field,
      question: row.question,
    }));
    return {
      questions,
      complete: result.data.complete ?? questions.length === 0,
      stubbed: false,
    };
  }

  const config = getCategoryQuestionnaire(category ?? null);
  const questions = stubGapCheck(body.businessProfile, config);
  return { questions, complete: questions.length === 0, stubbed: true };
}

/** POST /templates/match */
export async function intakeMatchTemplates(
  body: IntakeMatchRequest,
): Promise<IntakeMatchResponse> {
  const result = await intakeFetch<{
    matches: Array<{ templateId: string; score: number; reason: string }>;
  }>("/templates/match", {
    method: "POST",
    body: JSON.stringify({
      businessProfile: normalizeProfileForApi(
        body.businessProfile,
        body.categoryId,
        body.subcategoryId,
      ),
    }),
  });

  if (!result.stubbed) {
    const templates: MatchedTemplate[] = mapBackendMatches(result.data.matches ?? []);
    return { templates, stubbed: false };
  }

  return {
    templates: stubMatchTemplates(body.categoryId, body.subcategoryId, body.businessProfile),
    stubbed: true,
  };
}

export { listCategories };
