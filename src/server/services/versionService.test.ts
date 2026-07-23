// @vitest-environment node
// Port-fidelity tests for versionService (port of
// backend/studio/services/version_service.py): list_versions + restore.
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import * as editsRepo from "../repos/editsRepo";
import * as projectsRepo from "../repos/projectsRepo";
import * as versionsRepo from "../repos/versionsRepo";
import * as workingHtmlRepo from "../repos/workingHtmlRepo";
import * as versionService from "./versionService";

let projectId: string;

beforeEach(async () => {
  await freshTestDb();
  const project = await projectsRepo.create("Version Co", "Build site");
  projectId = project.projectId;
});

describe("listVersions", () => {
  it("returns an empty list for a project with no versions", async () => {
    expect(await versionService.listVersions(projectId)).toEqual([]);
  });

  it("returns versions newest first", async () => {
    await versionsRepo.create(projectId, { label: "v1", trigger: "manual", html: "<html><body>1</body></html>" });
    await new Promise((r) => setTimeout(r, 5));
    await versionsRepo.create(projectId, { label: "v2", trigger: "manual", html: "<html><body>2</body></html>" });
    const versions = await versionService.listVersions(projectId);
    expect(versions.map((v) => v.label)).toEqual(["v2", "v1"]);
  });

  it("404s for a missing project", async () => {
    await expect(versionService.listVersions("no-such-project")).rejects.toMatchObject({ status: 404 });
  });
});

describe("restore", () => {
  it("restores a snapshot as a new version and updates working html + project pointer", async () => {
    const original = await versionsRepo.create(projectId, {
      label: "original",
      trigger: "manual",
      html: "<html><body><h1>Original</h1></body></html>",
    });

    const result = await versionService.restore(projectId, original.versionId as string);
    expect(result.restoredFrom).toBe(original.versionId);
    expect(result.html).toBe("<html><body><h1>Original</h1></body></html>");
    expect(result.versionId).not.toBe(original.versionId);

    const working = await workingHtmlRepo.get(projectId);
    expect(working?.html).toContain("Original");

    const project = await projectsRepo.get(projectId);
    expect(project?.currentVersionId).toBe(result.versionId);
    expect(project?.status).toBe("editing");

    const edits = await editsRepo.listForProject(projectId);
    expect(edits[0]?.source).toBe("restore");
    expect(edits[0]?.changeScope).toBe("restore");
  });

  it("throws VersionError for an unknown version", async () => {
    await expect(versionService.restore(projectId, "no-such-version")).rejects.toBeInstanceOf(
      versionService.VersionError,
    );
  });

  it("404s for a missing project", async () => {
    await expect(versionService.restore("no-such-project", "v1")).rejects.toMatchObject({ status: 404 });
  });
});
