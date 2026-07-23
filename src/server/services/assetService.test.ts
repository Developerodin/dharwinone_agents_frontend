// @vitest-environment node
// Port of backend/studio/tests/test_asset_service.py — presign contract,
// confirm/list metadata, CDN public URLs, and the real-S3-client path (with
// the S3 backend stubbed so no network call is ever made).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import * as projectsRepo from "../repos/projectsRepo";
import * as s3 from "../storage/s3";
import * as assetService from "./assetService";

const ENV_KEYS = [
  "STUDIO_S3_MOCK",
  "STUDIO_ASSET_PUBLIC_BASE_URL",
  "AWS_REGION",
  "STUDIO_S3_BUCKET",
  "AWS_S3_BUCKET_NAME",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;
let savedEnv: Record<string, string | undefined>;

beforeEach(async () => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  process.env.STUDIO_S3_MOCK = "true";
  await freshTestDb();
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  s3.setS3ClientForTests(null);
});

describe("createPresign", () => {
  it("returns the upload contract (mock mode)", async () => {
    const project = await projectsRepo.create("Upload Co", "Site");
    const presign = await assetService.createPresign(project.projectId, {
      filename: "logo.png",
      contentType: "image/png",
      assetType: "logo",
    });
    expect(presign.assetId).toBeTruthy();
    expect(String(presign.uploadUrl)).toMatch(/^mock\+s3:\/\//);
    expect(String(presign.s3Key)).toMatch(new RegExp(`^projects/${project.projectId}/assets/`));
    expect((presign.headers as Record<string, string>)["Content-Type"]).toBe("image/png");
  });

  it("rejects an invalid asset type", async () => {
    const project = await projectsRepo.create("Upload Co", "Site");
    await expect(
      assetService.createPresign(project.projectId, {
        filename: "x.png",
        contentType: "image/png",
        assetType: "invalid",
      }),
    ).rejects.toBeInstanceOf(assetService.AssetValidationError);
  });

  it("404s for a missing project", async () => {
    await expect(
      assetService.createPresign("no-such-project", {
        filename: "x.png",
        contentType: "image/png",
        assetType: "logo",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("confirmUpload + listAssets", () => {
  it("confirms and lists asset metadata", async () => {
    const project = await projectsRepo.create("Upload Co", "Site");
    const presign = await assetService.createPresign(project.projectId, {
      filename: "hero.jpg",
      contentType: "image/jpeg",
      assetType: "brand",
    });
    const asset = await assetService.confirmUpload(project.projectId, {
      assetId: presign.assetId as string,
      s3Key: presign.s3Key as string,
      contentType: "image/jpeg",
      sizeBytes: 4096,
    });
    expect(asset?.status).toBe("ready");
    const listed = await assetService.listAssets(project.projectId);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.assetType).toBe("brand");
  });

  it("includes publicUrl when a CDN base is configured", async () => {
    process.env.STUDIO_ASSET_PUBLIC_BASE_URL = "https://cdn.dharwinone.com";
    const project = await projectsRepo.create("Upload Co", "Site");
    const presign = await assetService.createPresign(project.projectId, {
      filename: "logo.png",
      contentType: "image/png",
      assetType: "logo",
    });
    const asset = await assetService.confirmUpload(project.projectId, {
      assetId: presign.assetId as string,
      s3Key: presign.s3Key as string,
      contentType: "image/png",
      sizeBytes: 1200,
    });
    expect(asset?.publicUrl).toBe(`https://cdn.dharwinone.com/${presign.s3Key}`);
    const listed = await assetService.listAssets(project.projectId);
    expect(listed[0]?.publicUrl).toBe(asset?.publicUrl);
  });

  it("uses the real S3 backend (stubbed, no network) when mock mode is disabled", async () => {
    const project = await projectsRepo.create("Upload Co", "Site");
    process.env.STUDIO_S3_MOCK = "false";
    process.env.AWS_REGION = "ap-south-1";
    process.env.STUDIO_S3_BUCKET = "dharwin-studio-dev";
    delete process.env.AWS_S3_BUCKET_NAME;

    const calls: Array<{ bucket: string; key: string; contentType: string; expiresIn: number }> = [];
    s3.setS3ClientForTests({
      async presignPut(bucket, key, contentType, expiresInSeconds) {
        calls.push({ bucket, key, contentType, expiresIn: expiresInSeconds });
        return "https://uploads.example.com/presigned-put";
      },
    });

    const presign = await assetService.createPresign(project.projectId, {
      filename: "logo.png",
      contentType: "image/png",
      assetType: "logo",
    });
    expect(presign.uploadUrl).toBe("https://uploads.example.com/presigned-put");
    expect(presign.method).toBe("PUT");
    expect(calls).toHaveLength(1);
    expect(calls[0].bucket).toBe("dharwin-studio-dev");
    expect(calls[0].contentType).toBe("image/png");
    expect(calls[0].key).toMatch(new RegExp(`^projects/${project.projectId}/assets/`));
  });
});
