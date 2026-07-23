// Port of backend/studio/config.py — same accessor names (camelCased), same
// env var names and defaults, same lazy-cache-on-first-read semantics.
//
// Deviation: Python derives `_ROOT` (and from it `_DEFAULT_DATA`) from
// `__file__` — two directories up from backend/studio/config.py, i.e. the
// `backend` directory — as a compile-time constant. This port lives in a
// separate repo with no `backend` directory alongside it, so there is no
// direct analog. We substitute `backendDir()`, resolved from the
// STUDIO_BACKEND_DIR env var (default: "../../backend" relative to
// process.cwd()) — the same variable draft.ts uses to locate the HTML
// templates that still live in the Python backend until cutover, and the
// same default path the pre-existing src/app/template-preview route already
// hardcodes. `dataDir()`'s default is derived from it, mirroring how Python
// derived `_DEFAULT_DATA` from `_ROOT`.
//
// No mongo-related leftovers were found in the current config.py to skip,
// and no `builder_v2`/builderV2Enabled toggle exists in it either (recent
// backend commit "PostgreSQL persistence and single builder path" appears to
// have already removed it) — every accessor below is a 1:1 port of what's
// actually in the file today.
import path from "node:path";

const DEFAULT_PORT = 8787;
const TRUTHY = new Set(["1", "true", "yes", "on"]);

let _backendDir: string | null = null;
let _dataDir: string | null = null;
let _port: number | null = null;
let _databaseUrl: string | null = null;
let _s3Mock: boolean | null = null;
let _s3Bucket: string | null = null;

export function backendDir(): string {
  if (_backendDir === null) {
    _backendDir = process.env.STUDIO_BACKEND_DIR || path.resolve(process.cwd(), "../../backend");
  }
  return _backendDir;
}

export function dataDir(): string {
  if (_dataDir === null) {
    _dataDir = process.env.STUDIO_DATA || path.join(backendDir(), "studio", "data");
  }
  return _dataDir;
}

export function port(): number {
  if (_port === null) {
    _port = parseInt(process.env.STUDIO_PORT || String(DEFAULT_PORT), 10);
  }
  return _port;
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

export function heartbeatIntervalS(): number {
  return parseFloat(process.env.STUDIO_HEARTBEAT_INTERVAL || "10");
}

export function monitorIntervalS(): number {
  return parseFloat(process.env.STUDIO_MONITOR_INTERVAL || "5");
}

export function heartbeatStaleS(): number {
  return parseFloat(process.env.STUDIO_HEARTBEAT_STALE_SEC || "45");
}

export function databaseUrl(): string {
  if (_databaseUrl === null) {
    _databaseUrl =
      process.env.STUDIO_DATABASE_URL ||
      "postgresql+psycopg://studio:studio@localhost:5432/dharwin_studio";
  }
  return _databaseUrl;
}

function configuredBucket(): string {
  return (process.env.STUDIO_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || "").trim();
}

/**
 * Mock unless a real bucket and credentials are configured.
 *
 * STUDIO_S3_MOCK always wins when set. Without it, mocking on while real
 * creds sit in .env is how images silently never reached S3; tests pin it to
 * true explicitly.
 */
export function s3MockEnabled(): boolean {
  if (_s3Mock === null) {
    const raw = (process.env.STUDIO_S3_MOCK || "").trim().toLowerCase();
    if (raw) {
      _s3Mock = TRUTHY.has(raw);
    } else {
      _s3Mock = !(
        configuredBucket() &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
      );
    }
  }
  return _s3Mock;
}

export function s3Bucket(): string {
  if (_s3Bucket === null) {
    _s3Bucket = configuredBucket() || "dharwin-studio-dev";
  }
  return _s3Bucket;
}

/** Clear cached paths (tests only). */
export function resetForTests(): void {
  _backendDir = null;
  _dataDir = null;
  _port = null;
  _databaseUrl = null;
  _s3Mock = null;
  _s3Bucket = null;
}
