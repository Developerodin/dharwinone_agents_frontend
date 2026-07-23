// Port of backend/studio/services/asset_service.py — asset upload orchestration.
import { randomUUID } from "node:crypto";
import { HttpError } from "../policy";
import * as assetsRepo from "../repos/assetsRepo";
import * as projectsRepo from "../repos/projectsRepo";
import * as s3 from "../storage/s3";

const ALLOWED_TYPES = new Set(assetsRepo.allowedAssetTypes());
// Python's `\w` is Unicode-aware by default (str patterns are implicitly
// re.UNICODE in Python 3); JS's `\w` is ASCII-only even with the `u` flag,
// so the allowed filename charset is spelled out with Unicode property
// escapes instead to keep validation behavior equivalent.
const FILENAME_RE = /^[\p{L}\p{N}_.\- ]{1,120}$/u;

export class AssetValidationError extends Error {}

async function requireProject(projectId: string): Promise<void> {
  if (!(await projectsRepo.get(projectId))) {
    throw new HttpError(404, "project not found");
  }
}

export async function createPresign(
  projectId: string,
  opts: { filename: string; contentType: string; assetType: string },
): Promise<Record<string, unknown>> {
  await requireProject(projectId);
  if (!ALLOWED_TYPES.has(opts.assetType)) {
    throw new AssetValidationError("invalid asset type");
  }
  if (!opts.filename || !FILENAME_RE.test(opts.filename)) {
    throw new AssetValidationError("invalid filename");
  }
  if (!opts.contentType || !opts.contentType.includes("/")) {
    throw new AssetValidationError("invalid content type");
  }

  // uuid4().hex[:12] equivalent: 32 lowercase hex chars, first 12 taken.
  const assetId = randomUUID().replace(/-/g, "").slice(0, 12);
  const s3Key = s3.buildAssetKey(projectId, assetId, opts.filename);
  const signed = await s3.createPresignedPut(s3Key, opts.contentType);
  await assetsRepo.createPending(projectId, {
    assetId,
    assetType: opts.assetType,
    s3Key,
    filename: opts.filename,
    contentType: opts.contentType,
  });
  return {
    assetId,
    s3Key,
    uploadUrl: signed.url,
    method: signed.method,
    headers: signed.headers,
    expiresAt: signed.expiresAt,
  };
}

function withPublicUrl(asset: assetsRepo.AssetDoc | null): Record<string, unknown> | null {
  if (!asset) return asset;
  const out: Record<string, unknown> = { ...asset };
  const publicUrl = s3.publicAssetUrl((asset.s3Key as string) || "");
  if (publicUrl) out.publicUrl = publicUrl;
  return out;
}

export async function confirmUpload(
  projectId: string,
  opts: {
    assetId: string;
    s3Key: string;
    contentType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
  },
): Promise<Record<string, unknown> | null> {
  await requireProject(projectId);
  const pending = await assetsRepo.get(projectId, opts.assetId);
  if (!pending) throw new AssetValidationError("asset not found");
  if (pending.s3Key !== opts.s3Key) throw new AssetValidationError("s3 key mismatch");
  if (pending.contentType !== opts.contentType) throw new AssetValidationError("content type mismatch");
  if (opts.sizeBytes <= 0) throw new AssetValidationError("invalid file size");
  const asset = await assetsRepo.confirm(projectId, opts.assetId, {
    sizeBytes: opts.sizeBytes,
    width: opts.width ?? null,
    height: opts.height ?? null,
  });
  return withPublicUrl(asset);
}

export async function listAssets(projectId: string): Promise<Array<Record<string, unknown> | null>> {
  await requireProject(projectId);
  const assets = await assetsRepo.listForProject(projectId);
  return assets.map((asset) => withPublicUrl(asset));
}
