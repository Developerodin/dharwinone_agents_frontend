// Port of backend/studio/app.py `_require_jwt` middleware (Next 16 calls this proxy).
// Guards /api/*; verified user id travels to route handlers via the x-user-id
// request header (inbound values are always stripped — only the proxy may set it).
import { NextResponse, type NextRequest } from "next/server";
import { TokenError, verifyJwt } from "@/server/jwt";

const PUBLIC_PATHS = new Set([
  "/api/auth/register",
  "/api/auth/verify",
  "/api/auth/login",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
]);

// _PUBLIC_PATHS is exact-match; parametrized/webhook paths go here (plan fix A4).
// Telephony webhooks + health register themselves at phase N6.
const PUBLIC_PREFIXES: string[] = [];

function forward(request: NextRequest, userId?: string) {
  const headers = new Headers(request.headers);
  headers.delete("x-user-id");
  if (userId) headers.set("x-user-id", userId);
  return NextResponse.next({ request: { headers } });
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (
    request.method === "OPTIONS" ||
    PUBLIC_PATHS.has(path) ||
    PUBLIC_PREFIXES.some((p) => path.startsWith(p))
  ) {
    return forward(request);
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    return NextResponse.json({ detail: "authentication required" }, { status: 401 });
  }
  try {
    return forward(request, await verifyJwt(token));
  } catch (exc) {
    if (exc instanceof TokenError) {
      return NextResponse.json({ detail: "invalid or expired token" }, { status: 401 });
    }
    throw exc;
  }
}

export const config = {
  matcher: "/api/:path*",
};
