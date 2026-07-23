// @vitest-environment node
// Port-fidelity tests for legacyProjects (port of backend/studio/projects.py).
// Uses a throwaway temp directory as STUDIO_BACKEND_DIR so nothing here ever
// touches the real backend/studio/data.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as legacyProjects from "./legacyProjects";

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "studio-legacy-"));
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

describe("loadAll / get", () => {
  it("returns [] and null when projects.json doesn't exist yet", () => {
    expect(legacyProjects.loadAll()).toEqual([]);
    expect(legacyProjects.get("nope")).toBeNull();
  });
});

describe("create", () => {
  it("creates a project with a slugified id and the documented defaults", () => {
    const repoRoot = makeGitRepo("repo-a");
    const project = legacyProjects.create({ name: "My Cool Site!!", repo_root: repoRoot });
    expect(project.id).toBe("my-cool-site");
    expect(project.name).toBe("My Cool Site!!");
    expect(project.repo_root).toBe(path.resolve(repoRoot));
    expect(project.integration_branch).toBe("harness/integration");
    expect(project.dev_cmd).toBe("npm run dev");
    expect(project.dev_port_range).toEqual([4310, 4399]);
    expect(project.privacy).toBe("local_only");
    expect(project.stage_consents).toEqual([]);
    expect(project.providers).toBeNull();
    expect(project.knowledge_path).toBe("knowledge.yaml");
    expect(project.accept_templates).toBeTruthy();
  });

  it("falls back to 'project' when the name has no alphanumerics", () => {
    const repoRoot = makeGitRepo("repo-empty-name");
    const project = legacyProjects.create({ name: "!!!", repo_root: repoRoot });
    expect(project.id).toBe("project");
  });

  it("rejects a repo_root that isn't a git repository", () => {
    const notGit = path.join(tmpRoot, "not-git");
    fs.mkdirSync(notGit, { recursive: true });
    expect(() => legacyProjects.create({ name: "X", repo_root: notGit })).toThrow(
      legacyProjects.ProjectError,
    );
  });

  it("suffixes a colliding id with -2, then -3", () => {
    const repoRoot = makeGitRepo("repo-b");
    const first = legacyProjects.create({ name: "Bakery", repo_root: repoRoot });
    const second = legacyProjects.create({ name: "Bakery", repo_root: repoRoot });
    const third = legacyProjects.create({ name: "Bakery", repo_root: repoRoot });
    expect([first.id, second.id, third.id]).toEqual(["bakery", "bakery-2", "bakery-3"]);
  });

  it("respects explicit optional fields instead of defaulting them", () => {
    const repoRoot = makeGitRepo("repo-c");
    const project = legacyProjects.create({
      name: "Custom",
      repo_root: repoRoot,
      integration_branch: "main",
      dev_cmd: "pnpm dev",
      privacy: "per_stage",
      stage_consents: ["plan"],
      knowledge_path: "custom-knowledge.yaml",
    });
    expect(project.integration_branch).toBe("main");
    expect(project.dev_cmd).toBe("pnpm dev");
    expect(project.privacy).toBe("per_stage");
    expect(project.stage_consents).toEqual(["plan"]);
    expect(project.knowledge_path).toBe("custom-knowledge.yaml");
  });

  it("persists to projects.json and round-trips via loadAll/get", () => {
    const repoRoot = makeGitRepo("repo-d");
    const created = legacyProjects.create({ name: "Round Trip", repo_root: repoRoot });
    expect(legacyProjects.loadAll()).toHaveLength(1);
    expect(legacyProjects.get(created.id)).toEqual(created);
    expect(fs.existsSync(path.join(tmpRoot, "studio", "data", "projects.json"))).toBe(true);
  });
});

describe("saveAll", () => {
  it("overwrites projects.json atomically (no stray .tmp file left behind)", () => {
    const repoRoot = makeGitRepo("repo-e");
    const created = legacyProjects.create({ name: "Saved", repo_root: repoRoot });
    const mutated = { ...created, name: "Saved (renamed)" };
    legacyProjects.saveAll([mutated]);
    expect(legacyProjects.get(created.id)?.name).toBe("Saved (renamed)");
    const dataDir = path.join(tmpRoot, "studio", "data");
    expect(fs.readdirSync(dataDir).some((f) => f.endsWith(".tmp"))).toBe(false);
  });
});
