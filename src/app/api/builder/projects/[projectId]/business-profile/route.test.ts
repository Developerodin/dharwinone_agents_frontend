// @vitest-environment node
// Route-level tests for GET/PUT /api/builder/projects/[projectId]/business-profile,
// invoked directly against the exported handlers (port fidelity with
// app.py's business-profile GET/PUT, lines 413-433).
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "@/server/testDb";
import * as projectsRepo from "@/server/repos/projectsRepo";
import { GET, PUT } from "./route";

let projectId: string;

beforeEach(async () => {
  await freshTestDb();
  const project = await projectsRepo.create("Profile Route Co", "Build site");
  projectId = project.projectId;
});

function req(method: string, body?: unknown): Request {
  return new Request(`http://localhost/api/builder/projects/${projectId}/business-profile`, {
    method,
    headers: body !== undefined ? { "content-type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function params(pid: string = projectId): Promise<{ projectId: string }> {
  return Promise.resolve({ projectId: pid });
}

describe("GET", () => {
  it("returns the empty profile shell with a gate for a new project", async () => {
    const res = await GET(req("GET"), { params: params() });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.projectId).toBe(projectId);
    expect(json.completeness.percent).toBe(0);
    expect(json.gate.ready).toBe(false);
  });

  it("404s for a missing project", async () => {
    const res = await GET(req("GET"), { params: params("no-such-project") });
    expect(res.status).toBe(404);
    expect((await res.json()).detail).toBe("project not found");
  });
});

describe("PUT", () => {
  it("merges the patch and returns the updated profile with a recomputed gate", async () => {
    const res = await PUT(
      req("PUT", { brand: { brandName: "Acme Corp" }, contact: { email: "a@acme.com" } }),
      { params: params() },
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.brand.brandName).toBe("Acme Corp");
    expect(json.contact.email).toBe("a@acme.com");
    expect(json.completeness.missingFields).not.toContain("brand name");
  });

  it("excludes null fields from the patch like FastAPI's exclude_none", async () => {
    await PUT(req("PUT", { brand: { brandName: "First" } }), { params: params() });
    const res = await PUT(req("PUT", { brand: null }), { params: params() });
    const json = await res.json();
    // brand: null is dropped entirely, so the prior brandName is untouched.
    expect(json.brand.brandName).toBe("First");
  });

  it("422s on invalid contact email", async () => {
    const res = await PUT(req("PUT", { contact: { email: "not-an-email" } }), { params: params() });
    expect(res.status).toBe(422);
    expect(String((await res.json()).detail)).toMatch(/email/i);
  });

  it("422s on invalid JSON body", async () => {
    const bad = new Request(`http://localhost/api/builder/projects/${projectId}/business-profile`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await PUT(bad, { params: params() });
    expect(res.status).toBe(422);
  });

  it("404s for a missing project", async () => {
    const res = await PUT(req("PUT", { brand: { brandName: "X" } }), { params: params("no-such-project") });
    expect(res.status).toBe(404);
    expect((await res.json()).detail).toBe("project not found");
  });
});
