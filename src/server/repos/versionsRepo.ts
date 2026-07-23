// Port of backend/studio/repositories/versions_repo.py — same function surface,
// same returned shapes (camelCase, no `id`).
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../db";
import { toDoc } from "./doc";

export type VersionDoc = Record<string, unknown> & {
  versionId: string;
  projectId: string | null;
};

// Cross-language replica of Python's `str(sorted((profile or {}).items()))`:
// sort the top-level entries by key, then render like Python's repr of a list
// of (key, value) tuples. This reproduces Python's exact string byte-for-byte
// ONLY for flat profiles whose values are strings, numbers, booleans, or None —
// which is all _profile_hash is ever actually called with in practice. Nested
// dicts/lists get a best-effort deterministic rendering (own-key insertion
// order, not Python's `sorted`) that will NOT generally match Python's repr,
// and number formatting (e.g. Python's `1.0` vs JS's `1`) can also diverge.
function pyReprString(s: string): string {
  const hasSingle = s.includes("'");
  const hasDouble = s.includes('"');
  const quote = hasSingle && !hasDouble ? '"' : "'";
  let escaped = s.replace(/\\/g, "\\\\");
  escaped = quote === "'" ? escaped.replace(/'/g, "\\'") : escaped.replace(/"/g, '\\"');
  escaped = escaped.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  return `${quote}${escaped}${quote}`;
}

function pyRepr(value: unknown): string {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return pyReprString(value);
  if (Array.isArray(value)) return `[${value.map(pyRepr).join(", ")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return `{${entries.map(([k, v]) => `${pyReprString(k)}: ${pyRepr(v)}`).join(", ")}}`;
  }
  return String(value);
}

function profileHash(profile: Record<string, unknown> | null | undefined): string {
  const entries = Object.entries(profile ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const raw = `[${entries.map(([k, v]) => `(${pyReprString(k)}, ${pyRepr(v)})`).join(", ")}]`;
  return createHash("sha256").update(raw, "utf8").digest("hex").slice(0, 16);
}

export async function create(
  projectId: string,
  opts: {
    label: string | null;
    trigger: string | null;
    html: string | null;
    profile?: Record<string, unknown> | null;
  },
): Promise<VersionDoc> {
  const versionId = randomBytes(6).toString("hex");
  const now = Date.now() / 1000;
  const row = await prisma().builder_versions.create({
    data: {
      versionId,
      projectId,
      label: opts.label,
      trigger: opts.trigger,
      createdAt: now,
      snapshotHtml: opts.html,
      snapshotProfileHash: profileHash(opts.profile),
      s3HtmlKey: `projects/${projectId}/versions/${versionId}.html`,
    },
  });
  return toDoc(row) as VersionDoc;
}

export async function listForProject(projectId: string): Promise<VersionDoc[]> {
  const rows = await prisma().builder_versions.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => toDoc(row) as VersionDoc);
}

export async function get(projectId: string, versionId: string): Promise<VersionDoc | null> {
  const row = await prisma().builder_versions.findFirst({ where: { projectId, versionId } });
  return toDoc(row) as VersionDoc | null;
}

export async function head(projectId: string): Promise<VersionDoc | null> {
  const versions = await listForProject(projectId);
  return versions[0] ?? null;
}
