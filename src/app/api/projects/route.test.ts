// @vitest-environment node
// Port-fidelity tests for the legacy file-based /projects routes and their
// {projectId}/knowledge, /privacy, /consent-ledger, /stats sub-routes (port of
// backend/studio/app.py lines 359-376 and 640-707). Uses a throwaway temp
// directory as STUDIO_BACKEND_DIR — never touches the real backend/studio/data.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as listProjects, POST as createProject } from "./route";
import { GET as getProject } from "./[projectId]/route";
import { GET as getKnowledge, PUT as putKnowledge } from "./[projectId]/knowledge/route";
import { GET as getPrivacy, PUT as putPrivacy } from "./[projectId]/privacy/route";
import { GET as getConsentLedger } from "./[projectId]/consent-ledger/route";
import { GET as getStats } from "./[projectId]/stats/route";
import { statsPath } from "@/server/paths";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "studio-legacy-routes-"));
  process.env.STUDIO_BACKEND_DIR = tmpRoot;
  delete process.env.STUDIO_DATA;
});

afterEach(() => {
  delete process.env.STUDIO_BACKEND_DIR;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

function makeGitRepo(name: string): string {
  const repoRoot = path.join(tmpRoot, name);
  fs.mkdirSync(path.join(repoRoot, ".git"), { recursive: true });
  return repoRoot;
}

async function createLegacyProject(name: string, repoRoot: string) {
  const res = await createProject(
    new Request("http://localhost/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, repo_root: repoRoot }),
    }),
  );
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string };
}

function paramsFor(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

describe("GET/POST /projects", () => {
  it("GET returns [] with nothing created yet", async () => {
    const res = await listProjects();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("POST creates a project (201) and GET then lists it", async () => {
    const repoRoot = makeGitRepo("repo-a");
    const created = await createLegacyProject("Bakery Site", repoRoot);
    expect(created.id).toBe("bakery-site");

    const listRes = await listProjects();
    const all = (await listRes.json()) as Array<{ id: string }>;
    expect(all.map((p) => p.id)).toEqual([created.id]);
  });

  it("POST 422s when repo_root isn't a git repository", async () => {
    const notGit = path.join(tmpRoot, "not-a-repo");
    fs.mkdirSync(notGit, { recursive: true });
    const res = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Bad", repo_root: notGit }),
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.detail).toMatch(/not a git repository/);
  });
});

describe("GET /projects/{projectId}", () => {
  it("404s for an unknown project", async () => {
    const res = await getProject(new Request("http://localhost/api/projects/nope"), paramsFor("nope"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ detail: "project not found" });
  });

  it("200s with the full project doc when found", async () => {
    const repoRoot = makeGitRepo("repo-b");
    const created = await createLegacyProject("Findable", repoRoot);
    const res = await getProject(new Request("http://localhost/api/projects/x"), paramsFor(created.id));
    expect(res.status).toBe(200);
    const doc = await res.json();
    expect(doc.id).toBe(created.id);
    expect(doc.name).toBe("Findable");
  });
});

describe("GET/PUT /projects/{projectId}/knowledge", () => {
  it("404s for an unknown project", async () => {
    const res = await getKnowledge(new Request("http://localhost/x"), paramsFor("nope"));
    expect(res.status).toBe(404);
  });

  it("GET returns {} before any write, PUT then round-trips", async () => {
    const repoRoot = makeGitRepo("repo-c");
    const created = await createLegacyProject("KnowledgeProj", repoRoot);

    const emptyRes = await getKnowledge(new Request("http://localhost/x"), paramsFor(created.id));
    expect(await emptyRes.json()).toEqual({});

    const putRes = await putKnowledge(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stack: ["react"], deploy_branch: "main" }),
      }),
      paramsFor(created.id),
    );
    expect(putRes.status).toBe(200);
    expect(await putRes.json()).toEqual({ stack: ["react"], deploy_branch: "main" });

    const getRes = await getKnowledge(new Request("http://localhost/x"), paramsFor(created.id));
    expect(await getRes.json()).toEqual({ stack: ["react"], deploy_branch: "main" });
  });

  it("PUT 422s on an invalid knowledge payload", async () => {
    const repoRoot = makeGitRepo("repo-d");
    const created = await createLegacyProject("BadKnowledge", repoRoot);
    const res = await putKnowledge(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ unknownKey: true }),
      }),
      paramsFor(created.id),
    );
    expect(res.status).toBe(422);
  });
});

describe("GET/PUT /projects/{projectId}/privacy", () => {
  it("404s for an unknown project", async () => {
    const res = await getPrivacy(new Request("http://localhost/x"), paramsFor("nope"));
    expect(res.status).toBe(404);
  });

  it("GET returns local_only defaults, PUT updates and persists", async () => {
    const repoRoot = makeGitRepo("repo-e");
    const created = await createLegacyProject("PrivacyProj", repoRoot);

    const defaultRes = await getPrivacy(new Request("http://localhost/x"), paramsFor(created.id));
    expect(await defaultRes.json()).toEqual({ privacy: "local_only", stage_consents: [] });

    const putRes = await putPrivacy(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ privacy: "per_stage", stage_consents: ["plan", "implement"] }),
      }),
      paramsFor(created.id),
    );
    expect(putRes.status).toBe(200);
    expect(await putRes.json()).toEqual({ privacy: "per_stage", stage_consents: ["plan", "implement"] });

    // Persisted, not just returned in-memory.
    const getRes = await getPrivacy(new Request("http://localhost/x"), paramsFor(created.id));
    expect(await getRes.json()).toEqual({ privacy: "per_stage", stage_consents: ["plan", "implement"] });
  });

  it("PUT without stage_consents leaves the existing value untouched", async () => {
    const repoRoot = makeGitRepo("repo-f");
    const created = await createLegacyProject("PrivacyKeep", repoRoot);
    await putPrivacy(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ privacy: "per_stage", stage_consents: ["plan"] }),
      }),
      paramsFor(created.id),
    );
    const res = await putPrivacy(
      new Request("http://localhost/x", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ privacy: "local_only" }),
      }),
      paramsFor(created.id),
    );
    expect(await res.json()).toEqual({ privacy: "local_only", stage_consents: ["plan"] });
  });
});

describe("GET /projects/{projectId}/consent-ledger", () => {
  it("404s for an unknown project", async () => {
    const res = await getConsentLedger(new Request("http://localhost/x"), paramsFor("nope"));
    expect(res.status).toBe(404);
  });

  it("returns [] when nothing has been logged", async () => {
    const repoRoot = makeGitRepo("repo-g");
    const created = await createLegacyProject("LedgerProj", repoRoot);
    const res = await getConsentLedger(new Request("http://localhost/x"), paramsFor(created.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });
});

describe("GET /projects/{projectId}/stats", () => {
  it("404s for an unknown project", async () => {
    const res = await getStats(new Request("http://localhost/x"), paramsFor("nope"));
    expect(res.status).toBe(404);
  });

  it("returns {} when no stats file exists", async () => {
    const repoRoot = makeGitRepo("repo-h");
    const created = await createLegacyProject("StatsProj", repoRoot);
    const res = await getStats(new Request("http://localhost/x"), paramsFor(created.id));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});
  });

  it("passes through the stats file contents when present", async () => {
    const repoRoot = makeGitRepo("repo-i");
    const created = await createLegacyProject("StatsProj2", repoRoot);
    const p = statsPath(created.id);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify({ runs: 3, wins: 2 }), "utf-8");
    const res = await getStats(new Request("http://localhost/x"), paramsFor(created.id));
    expect(await res.json()).toEqual({ runs: 3, wins: 2 });
  });
});
