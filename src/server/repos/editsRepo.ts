// Port of backend/studio/repositories/edits_repo.py — same function surface,
// same returned shapes (camelCase, no `id`). The Python's keyword-only args
// become a single options object (TS has no keyword args) — a deliberate,
// documented deviation; field names/behavior are otherwise 1:1.
import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { toDoc } from "./doc";

export type EditDoc = Record<string, unknown> & {
  editId: string;
  projectId: string | null;
  versionId: string | null;
  ts: number | null;
  actor: string | null;
  source: string | null;
  userPrompt: string | null;
  actionSummary: string | null;
  changeScope: string | null;
  targets: unknown[];
};

export type AppendEditOptions = {
  source: string | null;
  userPrompt: string | null;
  actionSummary: string | null;
  changeScope: string | null;
  targets?: unknown[] | null;
  versionId?: string | null;
};

export async function append(projectId: string, options: AppendEditOptions): Promise<EditDoc> {
  const row = await prisma().builder_edits.create({
    data: {
      editId: randomBytes(6).toString("hex"),
      projectId,
      versionId: options.versionId ?? null,
      ts: Date.now() / 1000,
      actor: "user",
      source: options.source,
      userPrompt: options.userPrompt,
      actionSummary: options.actionSummary,
      changeScope: options.changeScope,
      targets: (options.targets ?? []) as Prisma.InputJsonValue,
    },
  });
  return toDoc(row) as EditDoc;
}

export async function listForProject(projectId: string): Promise<EditDoc[]> {
  const rows = await prisma().builder_edits.findMany({
    where: { projectId },
    orderBy: { ts: "desc" },
  });
  return rows.map((row) => toDoc(row) as EditDoc);
}
