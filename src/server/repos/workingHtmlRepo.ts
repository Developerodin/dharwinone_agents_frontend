// Port of backend/studio/repositories/working_html_repo.py — project working
// HTML persistence, same function surface and returned shapes.
import { prisma } from "../db";
import { sanitizeHtml } from "../draft";
import { toDoc } from "./doc";

const MAX_BYTES = 512 * 1024;

export class WorkingHtmlError extends Error {}

export type WorkingHtmlDoc = {
  projectId: string;
  html: string | null;
  selectedTemplateId: string | null;
  updatedAt: number | null;
};

function validate(html: string): void {
  if (Buffer.byteLength(html, "utf8") > MAX_BYTES) {
    throw new WorkingHtmlError("working html exceeds 512KB");
  }
  const low = html.toLowerCase();
  if (!low.includes("<html") || !low.includes("</html>")) {
    throw new WorkingHtmlError("working html must be a full document");
  }
}

export async function get(projectId: string): Promise<WorkingHtmlDoc | null> {
  const row = await prisma().builder_working_html.findFirst({ where: { projectId } });
  const doc = toDoc(row) as WorkingHtmlDoc | null;
  if (doc && doc.html) {
    doc.html = sanitizeHtml(doc.html);
  }
  return doc;
}

export async function put(
  projectId: string,
  html: string,
  options: { templateId?: string | null } = {},
): Promise<WorkingHtmlDoc | null> {
  validate(html);
  const sanitized = sanitizeHtml(html);
  const now = Date.now() / 1000;
  const selectedTemplateId = options.templateId ?? null;
  const row = await prisma().builder_working_html.upsert({
    where: { projectId },
    create: {
      projectId,
      html: sanitized,
      selectedTemplateId,
      updatedAt: now,
    },
    update: {
      html: sanitized,
      selectedTemplateId,
      updatedAt: now,
    },
  });
  return toDoc(row) as WorkingHtmlDoc | null;
}

export async function requireHtml(projectId: string): Promise<string> {
  const doc = await get(projectId);
  if (!doc || !doc.html) {
    throw new WorkingHtmlError("working html not found");
  }
  return doc.html;
}
