// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import { prisma } from "../db";
import * as profilesRepo from "./profilesRepo";

async function makeProject(projectId: string) {
  await prisma().builder_projects.create({ data: { projectId } });
}

beforeEach(async () => {
  await freshTestDb();
});

describe("get", () => {
  it("returns the empty-profile shape (no `id`) when no row exists", async () => {
    const doc = await profilesRepo.get("proj-1");
    expect(doc).not.toHaveProperty("id");
    expect(doc.projectId).toBe("proj-1");
    expect(doc.brand).toEqual({ brandName: null, businessName: null, tagline: null });
    expect(doc.business).toEqual({
      type: null,
      services: [],
      description: null,
      targetAudience: null,
    });
    expect(doc.location).toEqual({ country: null, state: null, city: null, address: null });
    expect(doc.contact).toEqual({ email: null, phone: null, website: null, socialLinks: [] });
    expect(doc.design).toEqual({ stylePreference: null });
    expect(doc.skipped).toEqual([]);
    expect(doc.completeness).toEqual({ percent: 0, missingFields: [] });
    expect(typeof doc.updatedAt).toBe("number");
  });

  it("fills null JSON columns with empty-profile defaults when a row exists", async () => {
    await makeProject("proj-2");
    // Directly insert a row with only `brand` set — every other JSON column null.
    await prisma().businessProfiles.create({
      data: { projectId: "proj-2", brand: { brandName: "Acme" } },
    });
    const doc = await profilesRepo.get("proj-2");
    expect(doc).not.toHaveProperty("id");
    expect(doc.brand).toEqual({ brandName: "Acme" });
    expect(doc.business).toEqual({
      type: null,
      services: [],
      description: null,
      targetAudience: null,
    });
    expect(doc.location).toEqual({ country: null, state: null, city: null, address: null });
    expect(doc.skipped).toEqual([]);
    expect(doc.completeness).toEqual({ percent: 0, missingFields: [] });
  });
});

describe("save", () => {
  it("upserts on projectId: create then update round-trips and stamps updatedAt", async () => {
    await makeProject("proj-3");
    const created = await profilesRepo.save({
      projectId: "proj-3",
      brand: { brandName: "First", businessName: null, tagline: null },
    });
    expect(created).not.toHaveProperty("id");
    expect(created.brand).toEqual({ brandName: "First", businessName: null, tagline: null });
    const firstUpdatedAt = created.updatedAt;

    const updated = await profilesRepo.save({
      projectId: "proj-3",
      brand: { brandName: "Second", businessName: null, tagline: null },
    });
    expect(updated).not.toHaveProperty("id");
    expect(updated.brand).toEqual({ brandName: "Second", businessName: null, tagline: null });
    expect(typeof updated.updatedAt).toBe("number");
    expect(updated.updatedAt).toBeGreaterThanOrEqual(firstUpdatedAt);

    // Only one row should exist for the project (update, not a duplicate insert).
    const rows = await prisma().businessProfiles.findMany({ where: { projectId: "proj-3" } });
    expect(rows).toHaveLength(1);
  });

  it("filters out keys that are not real columns", async () => {
    await makeProject("proj-4");
    const saved = await profilesRepo.save({
      projectId: "proj-4",
      brand: { brandName: "X", businessName: null, tagline: null },
      bogusField: "should be dropped",
    });
    expect(saved).not.toHaveProperty("bogusField");
  });
});
