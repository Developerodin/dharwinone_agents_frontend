// @vitest-environment node
// N0 done-check: the generated client reads rows the Python migration loaded.
// Needs the Docker Postgres up; skipped when DATABASE_URL is absent.
import "dotenv/config";
import { describe, expect, it } from "vitest";

describe.skipIf(!process.env.DATABASE_URL)("prisma baseline (N0)", () => {
  it("reads existing migrated data", async () => {
    const { prisma } = await import("./db");
    const count = await prisma().builder_projects.count();
    expect(count).toBeGreaterThan(0);
    const row = await prisma().builder_projects.findFirst();
    expect(row?.projectId).toBeTruthy();
    expect(typeof row?.createdAt).toBe("number");
  });
});
