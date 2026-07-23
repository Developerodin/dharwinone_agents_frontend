// Port of backend/studio/projects.py — the LEGACY file-based project registry
// (predates the Postgres-backed builder_projects table in
// server/repos/projectsRepo.ts; still served by GET/POST /projects and friends
// until the N8 cutover). Synchronous fs throughout, matching the Python module.
import fs from "node:fs";
import path from "node:path";
import { backendPath, dataDir, projectsPath, runDir, statsPath, venvPy } from "./paths";

const SLUG_RE = /[^a-z0-9]+/g;

export class ProjectError extends Error {}

function slug(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(SLUG_RE, "-")
    .slice(0, 24)
    .replace(/^-+|-+$/g, "");
  return s || "project";
}

function ensureDataDir(): void {
  fs.mkdirSync(dataDir(), { recursive: true });
}

function atomicWriteJson(filePath: string, obj: unknown): void {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

// Shape is intentionally loose (Record, plus the fields every project has) —
// this mirrors the Python module, which treats projects as plain dicts.
export type LegacyProject = Record<string, unknown> & {
  id: string;
  name: string;
  repo_root: string;
};

export function loadAll(): LegacyProject[] {
  const p = projectsPath();
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, "utf-8");
  // projects.json is written as plain JSON (see atomicWriteJson below); the
  // Python side reads it with yaml.safe_load, which parses JSON identically.
  const data: unknown = JSON.parse(raw);
  return Array.isArray(data) ? (data as LegacyProject[]) : [];
}

// Port of projects.py's private _save_all — exported because the
// /projects/{id}/privacy PUT route needs it too (the Python route bypasses
// the module's private helper the same way, writing via
// atomic_write_json(studio_config.projects_path(), all_p) directly).
export function saveAll(projects: LegacyProject[]): void {
  ensureDataDir();
  atomicWriteJson(projectsPath(), projects);
}

export function get(projectId: string): LegacyProject | null {
  for (const p of loadAll()) {
    if (p.id === projectId) return p;
  }
  return null;
}

function defaultAcceptTemplates(): Record<string, string[]> {
  const py = fs.existsSync(venvPy()) ? venvPy() : "python";
  return { default: [py, "-c", "import sys; sys.exit(0)"] };
}

// `fields` mirrors the Python dict interface (projects.create(fields)) —
// callers (routes) build this from validated request bodies; required keys
// (name, repo_root) are trusted to be present, same as Python's fields["..."].
export function create(fields: Record<string, unknown>): LegacyProject {
  const repoRoot = path.resolve(String(fields.repo_root));
  const gitDir = path.join(repoRoot, ".git");
  const isGitRepo = fs.existsSync(gitDir) && fs.statSync(gitDir).isDirectory();
  if (!isGitRepo) {
    throw new ProjectError(`repo_root is not a git repository: ${repoRoot}`);
  }

  const base = slug(String(fields.name));
  const existing = new Set(loadAll().map((p) => p.id));
  let pid = base;
  let n = 2;
  while (existing.has(pid)) {
    const suffix = `-${n}`;
    pid = (base.slice(0, 24 - suffix.length) + suffix).replace(/^-+|-+$/g, "");
    n += 1;
  }

  const project: LegacyProject = {
    id: pid,
    name: fields.name as string,
    repo_root: repoRoot,
    integration_branch: (fields.integration_branch as string | undefined) ?? "harness/integration",
    dev_cmd: (fields.dev_cmd as string | undefined) ?? "npm run dev",
    dev_port_range: fields.dev_port_range ?? [4310, 4399],
    accept_templates: fields.accept_templates ?? defaultAcceptTemplates(),
    privacy: (fields.privacy as string | undefined) ?? "local_only",
    stage_consents: fields.stage_consents ?? [],
    providers: fields.providers ?? null,
    knowledge_path: (fields.knowledge_path as string | undefined) ?? "knowledge.yaml",
  };

  const all = loadAll();
  all.push(project);
  saveAll(all);
  return project;
}

// --- harness config derivation (port of derive_harness_cfg) ---
//
// NOT used by any of the 12 ported routes (only the runs subsystem calls
// this, and the runs engine itself hasn't been ported — see N5). Included
// for module-level fidelity with projects.py. harness/config.yaml is a
// small static file (flat + one level of nested maps, no lists); parseYamlMapping
// below is a minimal reader scoped to exactly that shape, not general YAML.
type YamlScalar = string | number | boolean | null;
type YamlMapping = { [key: string]: YamlScalar | YamlMapping };

function parseYamlScalar(raw: string): YamlScalar {
  const s = raw.trim();
  if (s === "" || s === "null" || s === "~") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseYamlMapping(text: string): YamlMapping {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "" && !l.trim().startsWith("#"));
  let i = 0;
  const indentOf = (line: string) => line.length - line.trimStart().length;

  function parseBlock(minIndent: number): YamlMapping {
    const result: YamlMapping = {};
    while (i < lines.length) {
      const line = lines[i];
      const indent = indentOf(line);
      if (indent < minIndent) break;
      if (indent > minIndent) break; // defensive: caller passes the exact child indent
      const trimmed = line.trim();
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx === -1) {
        i++;
        continue;
      }
      const key = trimmed.slice(0, colonIdx).trim();
      const rest = trimmed.slice(colonIdx + 1).trim();
      i++;
      if (rest === "") {
        if (i < lines.length && indentOf(lines[i]) > indent) {
          result[key] = parseBlock(indentOf(lines[i]));
        } else {
          result[key] = {};
        }
      } else {
        result[key] = parseYamlScalar(rest);
      }
    }
    return result;
  }

  return parseBlock(0);
}

const HARNESS_DEFAULTS_PATH = backendPath("harness/config.yaml");

function loadHarnessDefaults(): YamlMapping {
  return parseYamlMapping(fs.readFileSync(HARNESS_DEFAULTS_PATH, "utf-8"));
}

export function deriveHarnessCfg(project: LegacyProject, runId: string): Record<string, unknown> {
  const defaults = loadHarnessDefaults();
  const runRoot = runDir(project.id, runId);
  const wtRoot = path.join("C:/wt", project.id);
  const relOrDefault = (key: string, fallback: string) => {
    const v = defaults[key];
    return typeof v === "string" ? v : fallback;
  };
  return {
    ollama_url: defaults.ollama_url,
    repo_root: project.repo_root,
    worktree_root: wtRoot,
    integration_branch: project.integration_branch,
    skeptic_path: backendPath(relOrDefault("skeptic_path", "harness/skeptic.yaml")),
    tasks_path: backendPath(relOrDefault("tasks_path", "harness/tasks.yaml")),
    generated_tasks_path: backendPath(
      relOrDefault("generated_tasks_path", "harness/generated_tasks.yaml"),
    ),
    journal_path: path.join(runRoot, "journal.jsonl"),
    stats_path: statsPath(project.id),
    packets_dir: path.join(runRoot, "packets"),
    report_path: path.join(runRoot, "report.md"),
    models: defaults.models,
    edit_format: defaults.edit_format,
    limits: defaults.limits,
    accept_templates: project.accept_templates ?? {},
  };
}
