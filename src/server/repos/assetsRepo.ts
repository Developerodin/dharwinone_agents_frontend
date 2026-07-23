// Port of backend/studio/repositories/assets_repo.py — same function surface,
// same returned shapes (camelCase, no `id`).
import { prisma } from "../db";
import { toDoc } from "./doc";

const ALLOWED_TYPES = new Set(["logo", "brand", "service", "team", "product"]);

export type AssetDoc = Record<string, unknown> & {
  assetId: string;
  projectId: string | null;
};

export function allowedAssetTypes(): string[] {
  return [...ALLOWED_TYPES].sort();
}

export async function createPending(
  projectId: string,
  opts: {
    assetId: string;
    assetType: string;
    s3Key: string;
    filename: string | null;
    contentType: string | null;
  },
): Promise<AssetDoc> {
  if (!ALLOWED_TYPES.has(opts.assetType)) {
    throw new Error("invalid asset type");
  }
  const now = Date.now() / 1000;
  const row = await prisma().project_assets.create({
    data: {
      assetId: opts.assetId,
      projectId,
      assetType: opts.assetType,
      filename: opts.filename,
      contentType: opts.contentType,
      s3Key: opts.s3Key,
      status: "pending",
      sizeBytes: null,
      width: null,
      height: null,
      uploadedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  });
  return toDoc(row) as AssetDoc;
}

export async function get(projectId: string, assetId: string): Promise<AssetDoc | null> {
  const row = await prisma().project_assets.findFirst({ where: { projectId, assetId } });
  return toDoc(row) as AssetDoc | null;
}

export async function confirm(
  projectId: string,
  assetId: string,
  opts: { sizeBytes: number; width?: number | null; height?: number | null },
): Promise<AssetDoc | null> {
  const now = Date.now() / 1000;
  await prisma().project_assets.updateMany({
    where: { projectId, assetId },
    data: {
      status: "ready",
      sizeBytes: opts.sizeBytes,
      width: opts.width ?? null,
      height: opts.height ?? null,
      uploadedAt: now,
      updatedAt: now,
    },
  });
  return get(projectId, assetId);
}

export async function listForProject(projectId: string): Promise<AssetDoc[]> {
  const rows = await prisma().project_assets.findMany({
    where: { projectId, status: "ready" },
    orderBy: { uploadedAt: "desc" },
  });
  return rows.map((row) => toDoc(row) as AssetDoc);
}
