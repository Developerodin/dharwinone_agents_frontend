// Port of backend/studio/paths.py — filesystem anchors for the (still-Python)
// backend package. Also folds in the handful of backend/studio/config.py path
// helpers that the ported file-based stores (legacyProjects.ts, knowledge.ts,
// consent.ts) need — data_dir/projects_path/run_dir/stats_path/consent_path.
// config.py's non-path concerns (port(), database_url(), s3 settings, heartbeat
// intervals, ...) are NOT ported here; they belong to systems not yet ported.
//
// N8 CUTOVER NOTE: the file-based project/knowledge/consent stores read and
// write the SAME on-disk files the Python backend uses (backend/studio/data/*,
// <repo_root>/knowledge.yaml, etc). Nothing here migrates or copies that data —
// it stays exactly where it is on disk until the Python backend is retired at
// the N8 cutover. Until then, both backends see the same files.
import path from "node:path";

// Python: BACKEND_ROOT = dirname(dirname(paths.py)) — i.e. the `backend/`
// directory. The Next app's cwd is frontend-separate/dharwinone_agents_frontend,
// so the default walks up to the sibling `backend/` directory; override with
// STUDIO_BACKEND_DIR (e.g. in tests, pointed at a throwaway temp dir).
export function backendRoot(): string {
  const override = process.env.STUDIO_BACKEND_DIR;
  return override ? path.resolve(override) : path.resolve(process.cwd(), "..", "..", "backend");
}

// Port of paths.py's VENV_PY.
export function venvPy(): string {
  return path.join(backendRoot(), ".venv", "Scripts", "python.exe");
}

// Port of paths.py's backend_path().
export function backendPath(relPath: string): string {
  if (path.isAbsolute(relPath)) return relPath;
  return path.normalize(path.join(backendRoot(), relPath));
}

// --- studio/config.py path helpers (subset used by the ported file stores) ---

// Python: STUDIO_DATA env, else `<BACKEND_ROOT>/studio/data`. Unlike config.py
// this is NOT cached across calls (config.py memoizes into a module global,
// reset only via reset_for_tests()) — recomputing per call is simpler and
// test-safe without needing an equivalent reset hook here.
export function dataDir(): string {
  return process.env.STUDIO_DATA ?? path.join(backendRoot(), "studio", "data");
}

export function projectsPath(): string {
  return path.join(dataDir(), "projects.json");
}

export function runsDir(projectId: string): string {
  return path.join(dataDir(), "runs", projectId);
}

export function runDir(projectId: string, runId: string): string {
  return path.join(runsDir(projectId), runId);
}

export function statsPath(projectId: string): string {
  return path.join(dataDir(), `${projectId}-stats.json`);
}

export function consentPath(projectId: string): string {
  return path.join(dataDir(), `${projectId}-consent.jsonl`);
}
