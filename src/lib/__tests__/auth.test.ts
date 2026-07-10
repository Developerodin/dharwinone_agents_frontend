import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  getToken,
  getUser,
  handleUnauthorized,
  login,
  logout,
  setSession,
} from "@/lib/auth";

const USER = { id: "usr-1", email: "a@b.com", name: "Jane" };

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("session storage", () => {
  it("stores and reads token + user", () => {
    setSession("tok123", USER);
    expect(getToken()).toBe("tok123");
    expect(getUser()).toEqual(USER);
  });

  it("logout clears everything", () => {
    setSession("tok123", USER);
    logout();
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });
});

describe("login", () => {
  it("stores the session on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ token: "tok123", user: USER }), { status: 200 }),
      ),
    );
    await login("a@b.com", "hunter2abc");
    expect(getToken()).toBe("tok123");
  });

  it("throws AuthApiError with code on unverified 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ detail: { code: "unverified", message: "verify your email" } }),
          { status: 403 },
        ),
      ),
    );
    const err = await login("a@b.com", "hunter2abc").catch((e) => e);
    expect(err).toBeInstanceOf(AuthApiError);
    expect(err.status).toBe(403);
    expect(err.code).toBe("unverified");
  });
});

describe("handleUnauthorized", () => {
  it("clears the session", () => {
    setSession("tok123", USER);
    const assignSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { assign: assignSpy },
      writable: true,
    });
    handleUnauthorized();
    expect(getToken()).toBeNull();
    expect(assignSpy).toHaveBeenCalledWith("/sign-in");
  });
});
