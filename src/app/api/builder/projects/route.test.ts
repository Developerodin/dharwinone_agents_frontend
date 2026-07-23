// @vitest-environment node
// Port-fidelity tests for GET/POST /builder/projects and GET
// /builder/projects/{projectId} (port of backend/studio/app.py lines 377-397).
// Handlers are invoked directly against a freshTestDb(), the same way
// authService.test.ts drives services directly.
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "@/server/testDb";
import * as projectsRepo from "@/server/repos/projectsRepo";
import { GET as listProjects, POST as createProject } from "./route";
import { GET as getProject } from "./[projectId]/route";

beforeEach(async () => {
  await freshTestDb();
});

function listRequest(userId: string | null): Request {
  const headers = new Headers();
  if (userId) headers.set("x-user-id", userId);
  return new Request("http://localhost/api/builder/projects", { headers });
}

function createRequest(userId: string | null, body: unknown): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (userId) headers.set("x-user-id", userId);
  return new Request("http://localhost/api/builder/projects", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("GET /builder/projects", () => {
  it("401s without a user id (port of auth.resolve_user_id)", async () => {
    const res = await listProjects(listRequest(null));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ detail: "authentication required" });
  });

  it("lists only the requesting user's owned + collaborator projects", async () => {
    const owned = await projectsRepo.create("Owned By Me", null, "usr-1");
    const asCollaborator = await projectsRepo.create("Not Mine", null, "usr-2");
    await projectsRepo.updateFields(asCollaborator.projectId, {
      collaborators: [{ userId: "usr-1", role: "editor" }],
    });
    await projectsRepo.create("Stranger's", null, "usr-3");

    const res = await listProjects(listRequest("usr-1"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ projectId: string }>;
    const ids = body.map((p) => p.projectId).sort();
    expect(ids).toEqual([asCollaborator.projectId, owned.projectId].sort());
  });

  it("returns [] for a user with no projects", async () => {
    await projectsRepo.create("Someone Else's", null, "usr-owner");
    const res = await listProjects(listRequest("usr-lonely"));
    expect(await res.json()).toEqual([]);
  });
});

describe("POST /builder/projects", () => {
  it("401s without a user id", async () => {
    const res = await createProject(createRequest(null, { projectName: "X" }));
    expect(res.status).toBe(401);
  });

  it("creates a project (201) and sets ownerUserId to the requesting user", async () => {
    const res = await createProject(
      createRequest("usr-9", { projectName: "New Site", initialPrompt: "build a bakery" }),
    );
    expect(res.status).toBe(201);
    const doc = await res.json();
    expect(doc.projectName).toBe("New Site");
    expect(doc.initialPrompt).toBe("build a bakery");
    expect(doc.ownerUserId).toBe("usr-9");
    expect(doc.status).toBe("onboarding");
    expect(doc).not.toHaveProperty("id");
  });

  it("defaults initialPrompt to null when omitted", async () => {
    const res = await createProject(createRequest("usr-10", { projectName: "No Prompt" }));
    const doc = await res.json();
    expect(doc.initialPrompt).toBeNull();
  });

  it("422s on an invalid body", async () => {
    const res = await createProject(createRequest("usr-11", { projectName: 5 }));
    expect(res.status).toBe(422);
  });
});

describe("GET /builder/projects/{projectId}", () => {
  it("404s for an unknown project", async () => {
    const res = await getProject(new Request("http://localhost/api/builder/projects/nope"), {
      params: Promise.resolve({ projectId: "nope" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ detail: "project not found" });
  });

  it("returns the project doc when found, with no auth required", async () => {
    const created = await projectsRepo.create("Findable");
    const res = await getProject(new Request("http://localhost/api/builder/projects/x"), {
      params: Promise.resolve({ projectId: created.projectId }),
    });
    expect(res.status).toBe(200);
    const doc = await res.json();
    expect(doc.projectId).toBe(created.projectId);
    expect(doc).not.toHaveProperty("id");
  });
});
