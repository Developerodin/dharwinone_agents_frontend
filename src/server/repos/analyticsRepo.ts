// Port of backend/studio/repositories/analytics_repo.py — same function
// surface, same returned shapes (camelCase, no `id`).
import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { toDoc } from "./doc";

export type AnalyticsDoc = Record<string, unknown> & {
  eventId: string;
  projectId: string | null;
  eventType: string | null;
  metadata: Record<string, unknown>;
  ts: number | null;
};

export async function track(
  projectId: string,
  eventType: string | null,
  metadata?: Record<string, unknown> | null,
): Promise<AnalyticsDoc> {
  const row = await prisma().builder_analytics.create({
    data: {
      eventId: randomBytes(6).toString("hex"),
      projectId,
      eventType,
      metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      ts: Date.now() / 1000,
    },
  });
  return toDoc(row) as AnalyticsDoc;
}

export async function listForProject(projectId: string): Promise<AnalyticsDoc[]> {
  const rows = await prisma().builder_analytics.findMany({
    where: { projectId },
    orderBy: { ts: "desc" },
  });
  return rows.map((row) => toDoc(row) as AnalyticsDoc);
}

export async function summarize(
  projectId: string,
): Promise<{ projectId: string; counts: Record<string, number>; total: number }> {
  const events = await listForProject(projectId);
  const counts: Record<string, number> = {};
  for (const event of events) {
    // Python: `event.get("eventType", "unknown")` — the "unknown" default only
    // fires when the key is absent, which never happens since to_doc always
    // populates every column (possibly with a null value). So this mirrors the
    // real runtime behavior: a null eventType is used as-is, not coerced to
    // "unknown" (it becomes the object key "null", same as Python's own
    // json.dumps({None: 1}) -> {"null": 1} once either side crosses a JSON
    // boundary).
    const key = String(event.eventType as string | null);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return { projectId, counts, total: events.length };
}
