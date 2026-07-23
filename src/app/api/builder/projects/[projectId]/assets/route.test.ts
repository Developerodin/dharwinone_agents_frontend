// @vitest-environment node
// Route-level flow test: presign -> confirm -> list, invoked directly against
// the exported handlers (port fidelity with app.py's assets endpoints,
// lines 602-638). S3 stays in mock mode so no network call is ever made.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { freshTestDb } from "@/server/testDb";
import * as projectsRepo from "@/server/repos/projectsRepo";
import { GET } from "./route";
import { POST as presign } from "./presign/route";
import { POST as confirm } from "./confirm/route";

let projectId: string;
let savedMock: string | undefined;

beforeEach(async () => {
  savedMock = process.env.STUDIO_S3_MOCK;
  process.env.STUDIO_S3_MOCK = "true";
  await freshTestDb();
  const project = await projectsRepo.create("Assets Route Co", "Build site");
  projectId = project.projectId;
});

afterEach(() => {
  if (savedMock === undefined) delete process.env.STUDIO_S3_MOCK;
  else process.env.STUDIO_S3_MOCK = savedMock;
});

function jsonReq(path: string, method: string, body: unknown): Request {
  return new Request(`http://localhost/api/builder/projects/${projectId}/${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function params(pid: string = projectId): Promise<{ projectId: string }> {
  return Promise.resolve({ projectId: pid });
}

describe("assets presign -> confirm -> list", () => {
  it("round-trips a full upload through the three routes", async () => {
    const presignRes = await presign(
      jsonReq("assets/presign", "POST", {
        filename: "logo.png",
        contentType: "image/png",
        assetType: "logo",
      }),
      { params: params() },
    );
    expect(presignRes.status).toBe(200);
    const presignJson = await presignRes.json();
    expect(String(presignJson.uploadUrl)).toMatch(/^mock\+s3:\/\//);
    expect(presignJson.method).toBe("PUT");

    const confirmRes = await confirm(
      jsonReq("assets/confirm", "POST", {
        assetId: presignJson.assetId,
        s3Key: presignJson.s3Key,
        contentType: "image/png",
        sizeBytes: 2048,
      }),
      { params: params() },
    );
    expect(confirmRes.status).toBe(200);
    const confirmJson = await confirmRes.json();
    expect(confirmJson.status).toBe("ready");
    expect(confirmJson.sizeBytes).toBe(2048);

    const listRes = await GET(new Request(`http://localhost/api/builder/projects/${projectId}/assets`), {
      params: params(),
    });
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(listJson).toHaveLength(1);
    expect(listJson[0].assetId).toBe(presignJson.assetId);
  });

  it("presign 422s on an invalid asset type", async () => {
    const res = await presign(
      jsonReq("assets/presign", "POST", { filename: "x.png", contentType: "image/png", assetType: "banner" }),
      { params: params() },
    );
    expect(res.status).toBe(422);
  });

  it("presign 404s for a missing project", async () => {
    const res = await presign(
      jsonReq("assets/presign", "POST", { filename: "x.png", contentType: "image/png", assetType: "logo" }),
      { params: params("no-such-project") },
    );
    expect(res.status).toBe(404);
  });

  it("confirm 422s on an s3 key mismatch", async () => {
    const presignRes = await presign(
      jsonReq("assets/presign", "POST", { filename: "logo.png", contentType: "image/png", assetType: "logo" }),
      { params: params() },
    );
    const presignJson = await presignRes.json();
    const res = await confirm(
      jsonReq("assets/confirm", "POST", {
        assetId: presignJson.assetId,
        s3Key: "projects/wrong/key.png",
        contentType: "image/png",
        sizeBytes: 10,
      }),
      { params: params() },
    );
    expect(res.status).toBe(422);
    expect((await res.json()).detail).toBe("s3 key mismatch");
  });

  it("list returns an empty array for a project with no confirmed assets", async () => {
    const res = await GET(new Request(`http://localhost/api/builder/projects/${projectId}/assets`), {
      params: params(),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("list 404s for a missing project", async () => {
    const res = await GET(new Request("http://localhost/api/builder/projects/no-such-project/assets"), {
      params: params("no-such-project"),
    });
    expect(res.status).toBe(404);
  });
});
