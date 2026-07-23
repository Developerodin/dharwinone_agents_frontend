// @vitest-environment node
// Port of the Python auth flow tests: register → adopt → verify → login → reset.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { freshTestDb } from "../testDb";
import { prisma } from "../db";
import { verifyJwt } from "../jwt";
import * as ratelimit from "../ratelimit";
import * as authService from "./authService";

let consoleSpy: ReturnType<typeof vi.spyOn>;

function lastEmailToken(kind: "verify" | "reset-password"): string {
  const logs = consoleSpy.mock.calls.map((c: unknown[]) => String(c[0])).join("\n");
  const matches = [...logs.matchAll(new RegExp(`/${kind}\\?token=([A-Za-z0-9_%-]+)`, "g"))];
  expect(matches.length).toBeGreaterThan(0);
  return decodeURIComponent(matches[matches.length - 1][1]);
}

beforeAll(() => {
  process.env.AUTH_JWT_SECRET = "auth-service-test-secret-0123456789";
  delete process.env.SMTP_USERNAME; // force console email fallback
});

beforeEach(async () => {
  await freshTestDb();
  ratelimit.resetForTests();
  consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("register", () => {
  it("rejects bad input with 422", async () => {
    await expect(authService.register("", "a@b.co", "abcd1234")).rejects.toMatchObject({ status: 422 });
    await expect(authService.register("A", "not-an-email", "abcd1234")).rejects.toMatchObject({ status: 422 });
    await expect(authService.register("A", "a@b.co", "short")).rejects.toMatchObject({ status: 422 });
    await expect(authService.register("A", "a@b.co", "lettersonly")).rejects.toMatchObject({ status: 422 });
  });

  it("creates a user (no password fields in response) and 409s duplicates", async () => {
    const user = await authService.register("Alice", "Alice@Example.com", "abcd1234");
    expect(user.email).toBe("alice@example.com");
    expect(user).not.toHaveProperty("passwordHash");
    await expect(authService.register("Bob", "alice@example.com", "abcd1234")).rejects.toMatchObject({
      status: 409,
    });
  });

  it("first user adopts legacy 'local-user' projects, second doesn't", async () => {
    await prisma().builder_projects.create({
      data: { projectId: "legacy-1", ownerUserId: "local-user", projectName: "Legacy" },
    });
    const first = await authService.register("First", "first@x.co", "abcd1234");
    const adopted = await prisma().builder_projects.findFirst({ where: { projectId: "legacy-1" } });
    expect(adopted?.ownerUserId).toBe(first.userId);
    const meta = await prisma().meta.findFirst({ where: { key: "legacy_adoption" } });
    expect((meta?.value as { userId: string }).userId).toBe(first.userId);
  });
});

describe("verify + login", () => {
  it("blocks unverified login with 403, then verifies and logs in", async () => {
    await authService.register("Cara", "cara@x.co", "abcd1234");
    await expect(authService.login("cara@x.co", "abcd1234")).rejects.toMatchObject({
      status: 403,
      detail: { code: "unverified", message: "verify your email before signing in" },
    });
    await authService.verifyEmail(lastEmailToken("verify"));
    const session = await authService.login("cara@x.co", "abcd1234");
    expect(session.user.email).toBe("cara@x.co");
    expect(await verifyJwt(session.token)).toBe(session.user.id);
  });

  it("generic 401 for wrong password or unknown email", async () => {
    await authService.register("Dan", "dan@x.co", "abcd1234");
    await expect(authService.login("dan@x.co", "wrongpw12")).rejects.toMatchObject({ status: 401 });
    await expect(authService.login("nobody@x.co", "abcd1234")).rejects.toMatchObject({ status: 401 });
  });

  it("rejects a reused or bogus verification token", async () => {
    await authService.register("Eve", "eve@x.co", "abcd1234");
    const token = lastEmailToken("verify");
    await authService.verifyEmail(token);
    await expect(authService.verifyEmail(token)).rejects.toMatchObject({ status: 400 });
    await expect(authService.verifyEmail("bogus")).rejects.toMatchObject({ status: 400 });
  });
});

describe("password reset", () => {
  it("full forgot → reset → login-with-new-password flow", async () => {
    await authService.register("Fay", "fay@x.co", "abcd1234");
    await authService.verifyEmail(lastEmailToken("verify"));
    await authService.forgotPassword("fay@x.co");
    const token = lastEmailToken("reset-password");
    await authService.resetPassword(token, "newpass99");
    await expect(authService.login("fay@x.co", "abcd1234")).rejects.toMatchObject({ status: 401 });
    const session = await authService.login("fay@x.co", "newpass99");
    expect(session.user.email).toBe("fay@x.co");
  });

  it("forgot for unknown email is a silent no-op", async () => {
    await expect(authService.forgotPassword("ghost@x.co")).resolves.toBeUndefined();
  });
});
