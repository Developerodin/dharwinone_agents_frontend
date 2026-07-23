// @vitest-environment node
// Port of backend/studio/tests/test_s3_storage.py — key building and public
// URL resolution (pure logic, no network).
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as s3 from "./s3";

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

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  delete process.env.STUDIO_ASSET_PUBLIC_BASE_URL;
  process.env.STUDIO_S3_MOCK = "true";
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  s3.setS3ClientForTests(null);
});

describe("publicAssetUrl", () => {
  it("uses the CDN base when configured", () => {
    process.env.STUDIO_ASSET_PUBLIC_BASE_URL = "https://cdn.dharwinone.com";
    expect(s3.publicAssetUrl("projects/p1/assets/a1/logo.png")).toBe(
      "https://cdn.dharwinone.com/projects/p1/assets/a1/logo.png",
    );
  });

  it("returns null in mock mode without a CDN base", () => {
    expect(s3.publicAssetUrl("projects/p1/assets/a1/logo.png")).toBeNull();
  });

  it("uses the region-qualified S3 host in real mode", () => {
    process.env.STUDIO_S3_MOCK = "false";
    process.env.AWS_REGION = "ap-south-1";
    process.env.STUDIO_S3_BUCKET = "dharwin-studio-dev";
    expect(s3.publicAssetUrl("studio/placeholders/fitness/0.jpg")).toBe(
      "https://dharwin-studio-dev.s3.ap-south-1.amazonaws.com/studio/placeholders/fitness/0.jpg",
    );
  });
});

describe("keyFromMockUrl", () => {
  it("extracts the key from a mock+s3:// URL", () => {
    expect(s3.keyFromMockUrl("mock+s3://dharwin-studio-dev/projects/p1/assets/a1/logo.png")).toBe(
      "projects/p1/assets/a1/logo.png",
    );
  });
});

describe("resolveImgSrc", () => {
  it("rewrites mock+s3:// URLs to the CDN base", () => {
    process.env.STUDIO_ASSET_PUBLIC_BASE_URL = "https://cdn.dharwinone.com";
    const src = "mock+s3://dharwin-studio-dev/projects/p1/assets/a1/logo.png";
    expect(s3.resolveImgSrc(src)).toBe("https://cdn.dharwinone.com/projects/p1/assets/a1/logo.png");
  });

  it("rewrites external https URLs to a cached CDN URL when configured", () => {
    process.env.STUDIO_ASSET_PUBLIC_BASE_URL = "https://cdn.dharwinone.com";
    const source = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800";
    const key = s3.buildUrlCacheKey(source);
    expect(s3.resolveImgSrc(source)).toBe(`https://cdn.dharwinone.com/${key}`);
  });

  it("leaves an already-public CDN asset URL untouched", () => {
    process.env.STUDIO_ASSET_PUBLIC_BASE_URL = "https://cdn.dharwinone.com";
    const logo = "https://cdn.dharwinone.com/projects/p1/assets/a1/logo.png";
    expect(s3.resolveImgSrc(logo)).toBe(logo);
  });
});

describe("buildPlaceholderKey / buildUrlCacheKey", () => {
  it("slugifies the genre", () => {
    expect(s3.buildPlaceholderKey("Fitness Gym", 1)).toBe("studio/placeholders/fitness-gym/1.jpg");
  });

  it("is deterministic per URL", () => {
    const url = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800";
    expect(s3.buildUrlCacheKey(url)).toMatch(/^studio\/assets\//);
    expect(s3.buildUrlCacheKey(url)).toBe(s3.buildUrlCacheKey(url));
  });
});

describe("ensureGenrePlaceholderUrl", () => {
  it("uploads via the stubbed backend when the object is missing", async () => {
    process.env.STUDIO_S3_MOCK = "false";
    process.env.AWS_REGION = "ap-south-1";
    process.env.STUDIO_S3_BUCKET = "dharwin-studio-dev";
    const uploaded: Array<{ key: string; contentType: string }> = [];
    s3.setS3ClientForTests({
      async headObject() {
        return false;
      },
      async putObject(_bucket, key, _data, contentType) {
        uploaded.push({ key, contentType });
      },
    });
    const originalFetch = global.fetch;
    global.fetch = (async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })) as typeof fetch;
    try {
      const url = await s3.ensureGenrePlaceholderUrl(
        "fitness",
        0,
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
      );
      expect(url).toBe("https://dharwin-studio-dev.s3.ap-south-1.amazonaws.com/studio/placeholders/fitness/0.jpg");
      expect(uploaded).toEqual([{ key: "studio/placeholders/fitness/0.jpg", contentType: "image/jpeg" }]);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("skips the upload when the object already exists", async () => {
    process.env.STUDIO_S3_MOCK = "false";
    process.env.AWS_REGION = "ap-south-1";
    s3.setS3ClientForTests({
      async headObject() {
        return true;
      },
      async putObject() {
        throw new Error("upload should not run");
      },
    });
    const url = await s3.ensureGenrePlaceholderUrl("cafe", 0, "https://example.com/x.jpg");
    expect(url).toContain("studio/placeholders/cafe/0.jpg");
  });

  it("returns null in mock mode without a CDN base", async () => {
    expect(await s3.ensureGenrePlaceholderUrl("cafe", 0, "https://example.com/x.jpg")).toBeNull();
  });
});
