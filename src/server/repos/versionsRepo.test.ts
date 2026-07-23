// @vitest-environment node
// Port-fidelity tests for versionsRepo (port of backend/studio/repositories/versions_repo.py).
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import * as projectsRepo from "./projectsRepo";
import * as versionsRepo from "./versionsRepo";

let projectId: string;

beforeEach(async () => {
  await freshTestDb();
  const project = await projectsRepo.create("Versioned Site");
  projectId = project.projectId;
});

describe("create", () => {
  it("creates a version (camelCase doc, no `id`) with a 12-hex versionId", async () => {
    const version = await versionsRepo.create(projectId, {
      label: "initial",
      trigger: "onboarding",
      html: "<html></html>",
      profile: { brandName: "Acme", tone: "playful" },
    });
    expect(version).not.toHaveProperty("id");
    expect(version.versionId).toMatch(/^[0-9a-f]{12}$/);
    expect(version.projectId).toBe(projectId);
    expect(version.label).toBe("initial");
    expect(version.trigger).toBe("onboarding");
    expect(version.snapshotHtml).toBe("<html></html>");
    expect(version.s3HtmlKey).toBe(`projects/${projectId}/versions/${version.versionId}.html`);
    expect(typeof version.snapshotProfileHash).toBe("string");
    expect((version.snapshotProfileHash as string).length).toBe(16);
  });

  it("hashes profiles deterministically regardless of key order", async () => {
    const v1 = await versionsRepo.create(projectId, {
      label: "a",
      trigger: "t",
      html: "<a/>",
      profile: { a: 1, b: "x" },
    });
    const v2 = await versionsRepo.create(projectId, {
      label: "b",
      trigger: "t",
      html: "<b/>",
      profile: { b: "x", a: 1 },
    });
    expect(v1.snapshotProfileHash).toBe(v2.snapshotProfileHash);
  });

  it("hashes a missing/null profile the same as an empty one", async () => {
    const v1 = await versionsRepo.create(projectId, { label: "a", trigger: "t", html: "<a/>" });
    const v2 = await versionsRepo.create(projectId, {
      label: "b",
      trigger: "t",
      html: "<b/>",
      profile: {},
    });
    expect(v1.snapshotProfileHash).toBe(v2.snapshotProfileHash);
  });
});

describe("get / listForProject / head", () => {
  it("round-trips a version via get()", async () => {
    const created = await versionsRepo.create(projectId, {
      label: "l",
      trigger: "t",
      html: "<h/>",
    });
    const fetched = await versionsRepo.get(projectId, created.versionId);
    expect(fetched).not.toHaveProperty("id");
    expect(fetched).toEqual(created);
  });

  it("returns null for an unknown version", async () => {
    expect(await versionsRepo.get(projectId, "deadbeefdead")).toBeNull();
  });

  it("head() returns the newest version", async () => {
    await versionsRepo.create(projectId, { label: "v1", trigger: "t", html: "<a/>" });
    await new Promise((r) => setTimeout(r, 5));
    const v2 = await versionsRepo.create(projectId, { label: "v2", trigger: "t", html: "<b/>" });
    const head = await versionsRepo.head(projectId);
    expect(head?.versionId).toBe(v2.versionId);
  });

  it("head() returns null when a project has no versions", async () => {
    const empty = await projectsRepo.create("No Versions");
    expect(await versionsRepo.head(empty.projectId)).toBeNull();
  });

  it("listForProject orders newest first", async () => {
    const v1 = await versionsRepo.create(projectId, { label: "v1", trigger: "t", html: "<a/>" });
    await new Promise((r) => setTimeout(r, 5));
    const v2 = await versionsRepo.create(projectId, { label: "v2", trigger: "t", html: "<b/>" });
    const list = await versionsRepo.listForProject(projectId);
    expect(list.map((v) => v.versionId)).toEqual([v2.versionId, v1.versionId]);
  });
});
