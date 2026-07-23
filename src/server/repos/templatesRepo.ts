// Port of backend/studio/repositories/templates_repo.py — same function
// surface, same returned shapes (camelCase, flattened `doc`).
import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "../db";
import { sanitizeHtml } from "../draft";

type TemplateRow = {
  templateId: string;
  projectId: string | null;
  galleryIndex: number | null;
  generatedAt: number | null;
  doc: unknown;
};

function isRowShape(row: unknown): row is TemplateRow {
  return typeof row === "object" && row !== null && "doc" in row;
}

function sanitizeHtmlContent(clean: Record<string, unknown>): Record<string, unknown> {
  if (clean.htmlContent) {
    clean.htmlContent = sanitizeHtml(clean.htmlContent as string);
  }
  return clean;
}

// Port of templates_repo._public: accepts either a DB row (with a `doc` JSON
// column to flatten) or an already-flat plain object (legacy Mongo-shaped
// document, stripped of `_id`).
function toPublic(row: unknown): Record<string, unknown> | null {
  if (!row) return null;
  if (!isRowShape(row)) {
    const clean = { ...(row as Record<string, unknown>) };
    delete clean._id;
    return sanitizeHtmlContent(clean);
  }
  const doc = row.doc && typeof row.doc === "object" ? (row.doc as Record<string, unknown>) : {};
  const clean: Record<string, unknown> = {
    ...doc,
    templateId: row.templateId,
    projectId: row.projectId,
    galleryIndex: row.galleryIndex,
    generatedAt: row.generatedAt,
  };
  return sanitizeHtmlContent(clean);
}

export async function replaceForProject(
  projectId: string,
  templates: Array<Record<string, unknown>>,
): Promise<Record<string, unknown>[]> {
  const now = Date.now() / 1000;
  const saved: Record<string, unknown>[] = [];
  await prisma().$transaction(async (tx) => {
    await tx.builder_templates.deleteMany({ where: { projectId } });
    for (let idx = 0; idx < templates.length; idx++) {
      const doc = { ...templates[idx] };
      const templateId = (doc.templateId as string) || randomBytes(6).toString("hex");
      const galleryIndex = ("galleryIndex" in doc ? doc.galleryIndex : idx) as number | null;
      const row = await tx.builder_templates.create({
        data: {
          templateId,
          projectId,
          galleryIndex,
          generatedAt: now,
          doc: doc as Prisma.InputJsonValue,
        },
      });
      saved.push(toPublic(row)!);
    }
  });
  saved.sort((a, b) => {
    const ai = (a.galleryIndex as number | null) ?? 999;
    const bi = (b.galleryIndex as number | null) ?? 999;
    if (ai !== bi) return ai - bi;
    const at = (a.templateId as string | null) ?? "";
    const bt = (b.templateId as string | null) ?? "";
    return at < bt ? -1 : at > bt ? 1 : 0;
  });
  return saved;
}

export async function listForProject(projectId: string): Promise<Record<string, unknown>[]> {
  const rows = await prisma().builder_templates.findMany({
    where: { projectId },
    orderBy: [{ galleryIndex: "asc" }, { templateId: "asc" }],
  });
  return rows.map((r) => toPublic(r)!);
}

export async function get(
  projectId: string,
  templateId: string,
): Promise<Record<string, unknown> | null> {
  const row = await prisma().builder_templates.findFirst({
    where: { projectId, templateId },
  });
  return toPublic(row);
}
