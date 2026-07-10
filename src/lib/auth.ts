const BASE = (process.env.NEXT_PUBLIC_STUDIO_API ?? "http://127.0.0.1:8787").trim();
const STORAGE_KEY = "dharwin.auth";

export type AuthUser = { id: string; email: string; name: string };

type SessionPayload = {
  token?: string;
  user?: AuthUser;
};

export class AuthApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function storage(): Storage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function readSession(): SessionPayload | null {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionPayload;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}

export function getUser(): AuthUser | null {
  return readSession()?.user ?? null;
}

export function setSession(token: string, user: AuthUser) {
  storage()?.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function logout() {
  storage()?.removeItem(STORAGE_KEY);
}

export function handleUnauthorized() {
  logout();
  if (typeof window !== "undefined") {
    window.location.assign("/sign-in");
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const payload = await res.json();
      if (typeof payload?.detail === "string") {
        message = payload.detail;
      } else if (payload?.detail) {
        code = payload.detail.code;
        message = payload.detail.message ?? JSON.stringify(payload.detail);
      }
    } catch {
      // keep default
    }
    throw new AuthApiError(res.status, message, code);
  }

  return res.json() as Promise<T>;
}

export async function login(email: string, password: string) {
  const result = await post<{ token: string; user: AuthUser }>("/auth/login", {
    email,
    password,
  });
  setSession(result.token, result.user);
  return result;
}

export async function register(name: string, email: string, password: string) {
  await post("/auth/register", { name, email, password });
}

export async function verifyEmail(token: string) {
  await post("/auth/verify", { token });
}

export async function resendVerification(email: string) {
  await post("/auth/resend-verification", { email });
}

export async function forgotPassword(email: string) {
  await post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string) {
  await post("/auth/reset-password", { token, password });
}
