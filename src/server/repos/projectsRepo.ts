// Port of backend/studio/repositories/projects_repo.py — same function surface,
// same returned shapes (camelCase, no `id`).
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { toDoc } from "./doc";

const SLUG_RE = /[^a-z0-9]+/g;

// Hardcoded from the builder_projects Prisma model's scalar columns (mirrors
// Python's `{c.name for c in Project.__table__.columns}`). The surrogate `id`
// column is intentionally excluded — it's never part of a doc (see toDoc) and
// Prisma's UpdateManyMutationInput has no `id` field to patch through anyway.
const PROJECT_COLUMNS = new Set([
  "projectId",
  "projectName",
  "status",
  "initialPrompt",
  "selectedTemplateId",
  "currentVersionId",
  "ownerUserId",
  "visibility",
  "collaborators",
  "createdAt",
  "updatedAt",
]);

export type ProjectDoc = Record<string, unknown> & {
  projectId: string;
  projectName: string | null;
};

function slug(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(SLUG_RE, "-")
    .slice(0, 24)
    .replace(/^-+|-+$/g, "");
  return s || "project";
}

async function uniqueId(base: string): Promise<string> {
  let pid = base;
  let n = 2;
  while (await prisma().builder_projects.findFirst({ where: { projectId: pid } })) {
    const suffix = `-${n}`;
    pid = (base.slice(0, 24 - suffix.length) + suffix).replace(/^-+|-+$/g, "");
    n += 1;
  }
  return pid;
}

export async function create(
  projectName: string,
  initialPrompt: string | null = null,
  ownerUserId = "local-user",
): Promise<ProjectDoc> {
  const now = Date.now() / 1000;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const row = await prisma().builder_projects.create({
        data: {
          projectId: await uniqueId(slug(projectName)),
          projectName,
          status: "onboarding",
          initialPrompt,
          selectedTemplateId: null,
          currentVersionId: null,
          ownerUserId,
          visibility: "private",
          collaborators: [],
          createdAt: now,
          updatedAt: now,
        },
      });
      return toDoc(row) as ProjectDoc;
    } catch (exc) {
      if (exc instanceof Prisma.PrismaClientKnownRequestError && exc.code === "P2002") {
        continue; // projectId race — retry with a fresh unique id
      }
      throw exc;
    }
  }
  throw new Error("could not allocate a unique projectId");
}

export async function listAll(): Promise<ProjectDoc[]> {
  const rows = await prisma().builder_projects.findMany({
    orderBy: { createdAt: { sort: "desc", nulls: "last" } },
  });
  return rows.map((row) => toDoc(row) as ProjectDoc);
}

export async function listForUser(userId: string): Promise<ProjectDoc[]> {
  const all = await listAll();
  return all.filter((d) => {
    if (d.ownerUserId === userId) return true;
    const collaborators = (d.collaborators as Array<Record<string, unknown>> | null) ?? [];
    return collaborators.some((c) => c?.userId === userId);
  });
}

export async function get(projectId: string): Promise<ProjectDoc | null> {
  const row = await prisma().builder_projects.findFirst({ where: { projectId } });
  return toDoc(row) as ProjectDoc | null;
}

export async function updateFields(
  projectId: string,
  fields: Record<string, unknown>,
): Promise<ProjectDoc | null> {
  const patch: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (PROJECT_COLUMNS.has(key)) patch[key] = value;
  }
  patch.updatedAt = Date.now() / 1000;
  await prisma().builder_projects.updateMany({
    where: { projectId },
    data: patch as Prisma.builder_projectsUpdateManyMutationInput,
  });
  return get(projectId);
}
