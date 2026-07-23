// Port of backend/studio/storage/s3.py — S3 presign helpers with mock-mode
// support. Same env vars, same key layout, same presign expiry.
//
// Deviations from the Python source:
// - `studio.config.s3_mock_enabled()`/`s3_bucket()` cache their result in a
//   module global; that's a pure perf optimization in Python (env vars don't
//   change at runtime) that would make tests that toggle env vars per-case
//   fragile without a `config.reset_for_tests()` equivalent. Every call here
//   reads `process.env` fresh instead.
// - The real boto3 client (`_s3_client()`) is replaced by a small `backend`
//   object wrapping @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner,
//   swappable via `setS3ClientForTests` so unit tests never hit the network —
//   the equivalent of Python tests doing `monkeypatch.setattr(s3, "_s3_client", ...)`.
import { createHash } from "node:crypto";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ALLOWED_PREFIXES = [
  "projects/",
  "studio/placeholders/",
  "studio/assets/",
  "studio/cache/",
  "studio/library/", // tagged stock photo library, seeded per category
] as const;
const PLACEHOLDER_PREFIX = "studio/placeholders/";
const MOCK_S3_RE = /^mock\+s3:\/\/[^/]+\/(.+)$/;
const TRUTHY = new Set(["1", "true", "yes", "on"]);

function validateKey(key: string | null | undefined): string {
  if (!key || key.startsWith("/")) throw new Error("invalid s3 key prefix");
  if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    throw new Error("invalid s3 key prefix");
  }
  return key;
}

// Python's `\w`/`c.isalnum()` are Unicode-aware by default (str patterns are
// implicitly re.UNICODE in Python 3); JS's `\w` is ASCII-only even with the
// `u` flag, so the allowed charset is spelled out with Unicode property
// escapes to keep filename sanitization behavior equivalent.
function sanitizeFilenameChar(c: string): string {
  return /[\p{L}\p{N}._-]/u.test(c) ? c : "-";
}

export function buildAssetKey(projectId: string, assetId: string, filename: string): string {
  const safeChars = Array.from(filename ?? "").map(sanitizeFilenameChar).join("");
  const safe = safeChars.replace(/^[.-]+|[.-]+$/g, "") || "asset.bin";
  return validateKey(`projects/${projectId}/assets/${assetId}/${safe}`);
}

export function buildPlaceholderKey(genre: string | null | undefined, slot: number | string): string {
  let safeGenre = (genre || "generic")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  safeGenre = safeGenre || "generic";
  const slotInt = Math.trunc(Number(slot));
  return validateKey(`${PLACEHOLDER_PREFIX}${safeGenre}/${slotInt}.jpg`);
}

export function buildUrlCacheKey(url: string | null | undefined): string {
  const normalized = (url ?? "").trim();
  const digest = createHash("sha256").update(normalized, "utf8").digest("hex").slice(0, 16);
  return validateKey(`studio/assets/${digest}.jpg`);
}

function configuredBucket(): string {
  return (process.env.STUDIO_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME || "").trim();
}

function s3MockEnabled(): boolean {
  const raw = (process.env.STUDIO_S3_MOCK || "").trim().toLowerCase();
  if (raw) return TRUTHY.has(raw);
  return !(configuredBucket() && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

function s3Bucket(): string {
  return configuredBucket() || "dharwin-studio-dev";
}

export function publicUrlsAvailable(): boolean {
  const base = (process.env.STUDIO_ASSET_PUBLIC_BASE_URL || "").trim();
  if (base) return true;
  return !s3MockEnabled();
}

export function keyFromMockUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = MOCK_S3_RE.exec(url.trim());
  return match ? match[1] : null;
}

function publicAssetBase(): string {
  return (process.env.STUDIO_ASSET_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
}

function isAlreadyPublicAssetUrl(src: string): boolean {
  const base = publicAssetBase();
  if (base && src.startsWith(`${base}/`)) return true;
  if (!s3MockEnabled()) {
    const bucket = s3Bucket();
    const region = (process.env.AWS_REGION || "").trim();
    const hosts = [`${bucket}.s3.amazonaws.com`];
    if (region) hosts.push(`${bucket}.s3.${region}.amazonaws.com`);
    if (hosts.some((host) => src.includes(host))) return true;
  }
  return false;
}

export function cachedPublicUrlForSource(url: string | null | undefined): string | null {
  const src = (url ?? "").trim();
  if (!src.startsWith("http://") && !src.startsWith("https://")) return null;
  if (isAlreadyPublicAssetUrl(src)) return null;
  if (!publicUrlsAvailable()) return null;
  return publicAssetUrl(buildUrlCacheKey(src));
}

export function resolveImgSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  const src = url.trim();
  const key = keyFromMockUrl(src);
  if (key) return publicAssetUrl(key);
  if (publicUrlsAvailable() && !/^(https?:\/\/|data:)/.test(src)) {
    if (ALLOWED_PREFIXES.some((prefix) => src.startsWith(prefix))) {
      return publicAssetUrl(src);
    }
  }
  if (/^https?:\/\//.test(src) && !isAlreadyPublicAssetUrl(src)) {
    const cached = cachedPublicUrlForSource(src);
    if (cached) return cached;
  }
  return src;
}

// --- real S3 backend (swappable for tests) ---------------------------------

type S3Backend = {
  headObject(bucket: string, key: string): Promise<boolean>;
  putObject(bucket: string, key: string, body: Uint8Array, contentType: string): Promise<void>;
  presignPut(bucket: string, key: string, contentType: string, expiresInSeconds: number): Promise<string>;
};

function clientConfig(): S3ClientConfig {
  const config: S3ClientConfig = {};
  const region = (process.env.AWS_REGION || "").trim();
  const endpoint = (process.env.AWS_S3_ENDPOINT_URL || "").trim();
  if (region) config.region = region;
  if (endpoint) config.endpoint = endpoint;
  return config;
}

function isNotFoundError(err: unknown): boolean {
  const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } } | null;
  if (!e) return false;
  if (e.name === "NotFound" || e.name === "NoSuchKey") return true;
  if (e.Code === "404" || e.Code === "NoSuchKey" || e.Code === "NotFound") return true;
  if (e.$metadata?.httpStatusCode === 404) return true;
  return false;
}

function createRealBackend(): S3Backend {
  return {
    async headObject(bucket, key) {
      const client = new S3Client(clientConfig());
      try {
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
      } catch (err) {
        if (isNotFoundError(err)) return false;
        throw err;
      }
    },
    async putObject(bucket, key, body, contentType) {
      const client = new S3Client(clientConfig());
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
      );
    },
    async presignPut(bucket, key, contentType, expiresInSeconds) {
      const client = new S3Client(clientConfig());
      const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    },
  };
}

let backend: S3Backend = createRealBackend();

// Test-only: inject a fake backend so unit tests never touch the network —
// the port equivalent of Python's `monkeypatch.setattr(s3, "_s3_client", ...)`.
export function setS3ClientForTests(override: Partial<S3Backend> | null): void {
  backend = override ? { ...createRealBackend(), ...override } : createRealBackend();
}

export async function objectExists(key: string): Promise<boolean> {
  validateKey(key);
  if (s3MockEnabled()) return false;
  return backend.headObject(s3Bucket(), key);
}

export async function uploadBytes(
  key: string,
  data: Uint8Array,
  contentType = "application/octet-stream",
): Promise<void> {
  validateKey(key);
  if (s3MockEnabled()) return;
  await backend.putObject(s3Bucket(), key, data, contentType);
}

async function fetchBytes(url: string, timeoutMs = 15000): Promise<{ data: Uint8Array; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { redirect: "follow", signal: controller.signal });
    if (!resp.ok) throw new Error(`request to ${url} failed with status ${resp.status}`);
    const contentType = (resp.headers.get("content-type") || "image/jpeg").split(";")[0].trim() || "image/jpeg";
    const data = new Uint8Array(await resp.arrayBuffer());
    return { data, contentType };
  } finally {
    clearTimeout(timer);
  }
}

export async function ensureUrlCached(url: string | null | undefined): Promise<string | null> {
  const src = (url ?? "").trim();
  if (!src.startsWith("http://") && !src.startsWith("https://")) return null;
  if (!publicUrlsAvailable()) return null;
  const key = buildUrlCacheKey(src);
  const publicUrl = publicAssetUrl(key);
  if (!publicUrl) return null;
  if (s3MockEnabled()) return publicUrl;
  if (!(await objectExists(key))) {
    try {
      const { data, contentType } = await fetchBytes(src);
      await uploadBytes(key, data, contentType);
    } catch {
      return null;
    }
  }
  return publicUrl;
}

export async function ensureGenrePlaceholderUrl(
  genre: string | null | undefined,
  slot: number | string,
  sourceUrl: string,
): Promise<string | null> {
  if (!publicUrlsAvailable()) return null;
  const key = buildPlaceholderKey(genre, slot);
  const publicUrl = publicAssetUrl(key);
  if (!publicUrl) return null;
  if (s3MockEnabled()) return publicUrl;
  if (!(await objectExists(key))) {
    try {
      const { data, contentType } = await fetchBytes(sourceUrl);
      await uploadBytes(key, data, contentType);
    } catch {
      return null;
    }
  }
  return publicUrl;
}

export async function createPresignedPut(
  key: string,
  contentType: string,
  expiresS = 3600,
): Promise<{ url: string; method: string; headers: Record<string, string>; expiresAt: number }> {
  validateKey(key);
  const headers = { "Content-Type": contentType };
  if (s3MockEnabled()) {
    const bucket = s3Bucket();
    return {
      url: `mock+s3://${bucket}/${key}`,
      method: "PUT",
      headers,
      expiresAt: Date.now() / 1000 + expiresS,
    };
  }
  const bucket = s3Bucket();
  const url = await backend.presignPut(bucket, key, contentType, expiresS);
  return {
    url,
    method: "PUT",
    headers,
    expiresAt: Date.now() / 1000 + expiresS,
  };
}

// Python's urllib.parse.quote(part, safe="") escapes everything outside
// unreserved chars (letters/digits/`_.-~`); encodeURIComponent leaves a few
// extra chars unescaped (`!'()*`), so those are escaped explicitly to match.
function pyQuote(part: string): string {
  return encodeURIComponent(part).replace(
    /[!*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function publicAssetUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  if (/^https?:\/\//.test(key)) return key;

  const normalized = key.replace(/^\/+/, "");
  const base = publicAssetBase();
  if (base) {
    const safeKey = normalized.split("/").map(pyQuote).join("/");
    return `${base}/${safeKey}`;
  }

  if (s3MockEnabled()) return null;

  const bucket = s3Bucket();
  const region = (process.env.AWS_REGION || "").trim();
  if (region) return `https://${bucket}.s3.${region}.amazonaws.com/${normalized}`;
  return `https://${bucket}.s3.amazonaws.com/${normalized}`;
}
