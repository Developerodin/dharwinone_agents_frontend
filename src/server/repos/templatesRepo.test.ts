// @vitest-environment node
// Port of the relevant cases from backend/studio/tests/test_builder_templates_api.py
// and test_draft.py's templates_repo._public coverage.
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import { prisma } from "../db";
import * as templatesRepo from "./templatesRepo";

beforeEach(async () => {
  await freshTestDb();
});

async function seedProject(projectId: string): Promise<void> {
  await prisma().builder_projects.create({ data: { projectId, projectName: "Test" } });
}

describe("replaceForProject", () => {
  it("replaces (not appends) existing templates and sorts by galleryIndex then templateId", async () => {
    await seedProject("p-sort");
    await templatesRepo.replaceForProject("p-sort", [
      { templateId: "old-1", galleryIndex: 0, htmlContent: "<html></html>" },
    ]);

    const saved = await templatesRepo.replaceForProject("p-sort", [
      { templateId: "saas-bold-pop", label: "Pack", galleryIndex: 3, htmlContent: "<html></html>" },
      { templateId: "composed-1", label: "Composed 1", galleryIndex: 0, htmlContent: "<html></html>" },
      { templateId: "composed-2", label: "Composed 2", galleryIndex: 1, htmlContent: "<html></html>" },
    ]);

    expect(saved.map((t) => t.templateId)).toEqual(["composed-1", "composed-2", "saas-bold-pop"]);

    const listed = await templatesRepo.listForProject("p-sort");
    expect(listed.map((t) => t.templateId)).toEqual(["composed-1", "composed-2", "saas-bold-pop"]);
    expect(listed.find((t) => t.templateId === "old-1")).toBeUndefined();
  });

  it("generates a 12-hex-char templateId when the item has none", async () => {
    await seedProject("p-gen");
    const saved = await templatesRepo.replaceForProject("p-gen", [{ label: "No id" }]);
    expect(saved).toHaveLength(1);
    expect(saved[0].templateId as string).toMatch(/^[0-9a-f]{12}$/);
  });

  it("defaults galleryIndex to the array position when the item omits it", async () => {
    await seedProject("p-idx");
    const saved = await templatesRepo.replaceForProject("p-idx", [
      { templateId: "a" },
      { templateId: "b" },
    ]);
    const byId = Object.fromEntries(saved.map((t) => [t.templateId, t.galleryIndex]));
    expect(byId.a).toBe(0);
    expect(byId.b).toBe(1);
  });
});

describe("get", () => {
  it("returns the flattened doc shape and sanitizes htmlContent", async () => {
    await seedProject("p-get");
    await templatesRepo.replaceForProject("p-get", [
      {
        templateId: "t1",
        galleryIndex: 0,
        label: "One",
        htmlContent: "<html><body><script>alert(1)</script><h1>Hi</h1></body></html>",
      },
    ]);

    const doc = await templatesRepo.get("p-get", "t1");
    expect(doc).toMatchObject({
      templateId: "t1",
      projectId: "p-get",
      galleryIndex: 0,
      label: "One",
    });
    expect(doc).toHaveProperty("generatedAt");
    expect(doc!.htmlContent as string).not.toContain("<script>");
    expect(doc!.htmlContent as string).toContain("<h1>Hi</h1>");
  });

  it("returns null when not found", async () => {
    await seedProject("p-missing");
    expect(await templatesRepo.get("p-missing", "nope")).toBeNull();
  });
});
