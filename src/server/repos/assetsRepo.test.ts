// @vitest-environment node
// Port-fidelity tests for assetsRepo (port of backend/studio/repositories/assets_repo.py).
import { beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "../testDb";
import * as assetsRepo from "./assetsRepo";
import * as projectsRepo from "./projectsRepo";

let projectId: string;

beforeEach(async () => {
  await freshTestDb();
  const project = await projectsRepo.create("Asset Owning Site");
  projectId = project.projectId;
});

describe("allowedAssetTypes", () => {
  it("returns the frozen set, sorted", () => {
    expect(assetsRepo.allowedAssetTypes()).toEqual(["brand", "logo", "product", "service", "team"]);
  });
});

describe("createPending", () => {
  it("creates a pending asset (camelCase doc, no `id`)", async () => {
    const asset = await assetsRepo.createPending(projectId, {
      assetId: "ast-1",
      assetType: "logo",
      s3Key: "projects/x/assets/ast-1.png",
      filename: "logo.png",
      contentType: "image/png",
    });
    expect(asset).not.toHaveProperty("id");
    expect(asset.assetId).toBe("ast-1");
    expect(asset.projectId).toBe(projectId);
    expect(asset.status).toBe("pending");
    expect(asset.sizeBytes).toBeNull();
    expect(asset.uploadedAt).toBeNull();
    expect(typeof asset.createdAt).toBe("number");
  });

  it("rejects an asset type outside the frozen allow-list", async () => {
    await expect(
      assetsRepo.createPending(projectId, {
        assetId: "ast-bad",
        assetType: "banner",
        s3Key: "x",
        filename: "x.png",
        contentType: "image/png",
      }),
    ).rejects.toThrow("invalid asset type");
  });
});

describe("get / confirm / listForProject", () => {
  it("round-trips a pending asset via get()", async () => {
    const created = await assetsRepo.createPending(projectId, {
      assetId: "ast-2",
      assetType: "brand",
      s3Key: "k",
      filename: "f.png",
      contentType: "image/png",
    });
    const fetched = await assetsRepo.get(projectId, created.assetId);
    expect(fetched).not.toHaveProperty("id");
    expect(fetched).toEqual(created);
  });

  it("confirm() flips status to ready and fills in size/dimensions", async () => {
    const created = await assetsRepo.createPending(projectId, {
      assetId: "ast-3",
      assetType: "team",
      s3Key: "k",
      filename: "f.png",
      contentType: "image/png",
    });
    const confirmed = await assetsRepo.confirm(projectId, created.assetId, {
      sizeBytes: 1024,
      width: 100,
      height: 200,
    });
    expect(confirmed?.status).toBe("ready");
    expect(confirmed?.sizeBytes).toBe(1024);
    expect(confirmed?.width).toBe(100);
    expect(confirmed?.height).toBe(200);
    expect(typeof confirmed?.uploadedAt).toBe("number");
  });

  it("listForProject hides pending assets and shows only ready ones, newest first", async () => {
    const pending = await assetsRepo.createPending(projectId, {
      assetId: "ast-pending",
      assetType: "logo",
      s3Key: "k",
      filename: "f.png",
      contentType: "image/png",
    });
    const readyA = await assetsRepo.createPending(projectId, {
      assetId: "ast-ready-a",
      assetType: "service",
      s3Key: "k",
      filename: "f.png",
      contentType: "image/png",
    });
    await assetsRepo.confirm(projectId, readyA.assetId, { sizeBytes: 10 });
    await new Promise((r) => setTimeout(r, 5));
    const readyB = await assetsRepo.createPending(projectId, {
      assetId: "ast-ready-b",
      assetType: "product",
      s3Key: "k",
      filename: "f.png",
      contentType: "image/png",
    });
    await assetsRepo.confirm(projectId, readyB.assetId, { sizeBytes: 20 });

    const list = await assetsRepo.listForProject(projectId);
    const ids = list.map((a) => a.assetId);
    expect(ids).toEqual([readyB.assetId, readyA.assetId]);
    expect(ids).not.toContain(pending.assetId);
  });
});
