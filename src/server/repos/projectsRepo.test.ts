// @vitest-environment node
// Port-fidelity tests for projectsRepo (port of backend/studio/repositories/projects_repo.py).
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import * as projectsRepo from "./projectsRepo";

beforeEach(async () => {
  await freshTestDb();
});

describe("create", () => {
  it("creates a project (camelCase doc, no `id`) with a slugified projectId", async () => {
    const project = await projectsRepo.create("My Cool Site!!", "build me a bakery site");
    expect(project).not.toHaveProperty("id");
    expect(project.projectId).toBe("my-cool-site");
    expect(project.projectName).toBe("My Cool Site!!");
    expect(project.initialPrompt).toBe("build me a bakery site");
    expect(project.status).toBe("onboarding");
    expect(project.ownerUserId).toBe("local-user");
    expect(project.visibility).toBe("private");
    expect(project.collaborators).toEqual([]);
    expect(typeof project.createdAt).toBe("number");
    expect(typeof project.updatedAt).toBe("number");
  });

  it("falls back to 'project' when the name has no alphanumerics", async () => {
    const project = await projectsRepo.create("!!!");
    expect(project.projectId).toBe("project");
  });

  it("suffixes a colliding slug with -2, then -3", async () => {
    const first = await projectsRepo.create("Bakery");
    const second = await projectsRepo.create("Bakery");
    const third = await projectsRepo.create("Bakery");
    expect(first.projectId).toBe("bakery");
    expect(second.projectId).toBe("bakery-2");
    expect(third.projectId).toBe("bakery-3");
  });

  it("respects an explicit ownerUserId", async () => {
    const project = await projectsRepo.create("Owned", null, "usr-abc");
    expect(project.ownerUserId).toBe("usr-abc");
  });
});

describe("get / listAll / listForUser", () => {
  it("round-trips a single project via get()", async () => {
    const created = await projectsRepo.create("Round Trip");
    const fetched = await projectsRepo.get(created.projectId);
    expect(fetched).not.toHaveProperty("id");
    expect(fetched).toEqual(created);
  });

  it("returns null for an unknown projectId", async () => {
    expect(await projectsRepo.get("nope")).toBeNull();
  });

  it("listAll orders newest first (nulls last)", async () => {
    const a = await projectsRepo.create("Alpha");
    await new Promise((r) => setTimeout(r, 5));
    const b = await projectsRepo.create("Beta");
    const all = await projectsRepo.listAll();
    const ids = all.map((p) => p.projectId);
    expect(ids.indexOf(b.projectId)).toBeLessThan(ids.indexOf(a.projectId));
  });

  it("listForUser matches by ownerUserId or collaborator userId", async () => {
    const owned = await projectsRepo.create("Owned By Me", null, "usr-1");
    const other = await projectsRepo.create("Not Mine", null, "usr-2");
    await projectsRepo.updateFields(other.projectId, {
      collaborators: [{ userId: "usr-1", role: "editor" }],
    });

    const mine = await projectsRepo.listForUser("usr-1");
    const ids = mine.map((p) => p.projectId).sort();
    expect(ids).toEqual([other.projectId, owned.projectId].sort());

    const strangers = await projectsRepo.listForUser("usr-3");
    expect(strangers).toEqual([]);
  });
});

describe("updateFields", () => {
  it("patches only known columns and always bumps updatedAt", async () => {
    const created = await projectsRepo.create("Patchable");
    await new Promise((r) => setTimeout(r, 5));
    const updated = await projectsRepo.updateFields(created.projectId, {
      status: "generating",
      notARealColumn: "should be dropped",
    });
    expect(updated?.status).toBe("generating");
    expect(updated).not.toHaveProperty("notARealColumn");
    expect(updated?.updatedAt).toBeGreaterThan(created.updatedAt as number);
  });
});
