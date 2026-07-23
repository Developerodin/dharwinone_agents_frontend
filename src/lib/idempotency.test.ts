import { afterEach, describe, expect, it } from "vitest";
import { newIdempotencyKey, resetIdempotencyKey } from "@/lib/idempotency";

afterEach(() => {
  resetIdempotencyKey("site-1", "generate");
  resetIdempotencyKey("site-1", "rewrite");
});

describe("newIdempotencyKey", () => {
  it("returns keys with length >= 8", () => {
    const key = newIdempotencyKey("site-1", "generate");
    expect(key.length).toBeGreaterThanOrEqual(8);
  });

  it("is deterministic within the same turn", () => {
    const a = newIdempotencyKey("site-1", "generate");
    const b = newIdempotencyKey("site-1", "generate");
    expect(a).toBe(b);
  });

  it("differs per action", () => {
    const gen = newIdempotencyKey("site-1", "generate");
    const rewrite = newIdempotencyKey("site-1", "rewrite");
    expect(gen).not.toBe(rewrite);
  });

  it("resets after resetIdempotencyKey", () => {
    const first = newIdempotencyKey("site-1", "generate");
    resetIdempotencyKey("site-1", "generate");
    const second = newIdempotencyKey("site-1", "generate");
    expect(second).not.toBe(first);
  });
});
