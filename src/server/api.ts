// Shared route-handler helpers (ports of app.py's _client_ip/_request_base_url/
// _rate_limit/_auth_error + zod body parsing in place of FastAPI validation).
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { HttpError, requireAction } from "./policy";
import * as ratelimit from "./ratelimit";
import * as projectsRepo from "./repos/projectsRepo";
import { AuthError } from "./services/authService";

export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || "unknown";
}

export function requestBaseUrl(request: Request): string {
  // Prefer proxy-forwarded host/proto so email links use the public domain.
  const proto = (request.headers.get("x-forwarded-proto") ?? "").split(",")[0].trim();
  const host = (request.headers.get("x-forwarded-host") ?? "").split(",")[0].trim();
  if (proto && host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export function rateLimit(key: string, limit: number, windowS: number): NextResponse | null {
  if (ratelimit.allow(key, limit, windowS)) return null;
  return NextResponse.json(
    { detail: "too many requests" },
    { status: 429, headers: { "Retry-After": String(ratelimit.retryAfter(key, windowS)) } },
  );
}

export function authErrorResponse(exc: AuthError): NextResponse {
  return NextResponse.json({ detail: exc.detail }, { status: exc.status });
}

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ body: T; error: null } | { body: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { body: null, error: NextResponse.json({ detail: "invalid JSON body" }, { status: 422 }) };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      body: null,
      error: NextResponse.json({ detail: parsed.error.issues }, { status: 422 }),
    };
  }
  return { body: parsed.data, error: null };
}

export function userId(request: Request): string {
  // Set by src/proxy.ts after JWT verification; absent only on public paths.
  return request.headers.get("x-user-id") ?? "";
}

export function httpErrorResponse(exc: HttpError): NextResponse {
  return NextResponse.json({ detail: exc.detail }, { status: exc.status });
}

// Port of app.py _builder_project_or_404 + _require_builder_action.
export async function builderProjectOr404(
  projectId: string,
): Promise<Record<string, unknown>> {
  const project = await projectsRepo.get(projectId);
  if (!project) throw new HttpError(404, "project not found");
  return project;
}

export async function requireBuilderAction(
  projectId: string,
  uid: string,
  action: string,
): Promise<Record<string, unknown>> {
  const project = await builderProjectOr404(projectId);
  requireAction(project, uid, action);
  return project;
}
