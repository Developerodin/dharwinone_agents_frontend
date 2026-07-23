const turnKeys = new Map<string, string>();

function randomSuffix(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable per (siteId, action) within a browser session; new key each page load. */
export function newIdempotencyKey(siteId: string, action: string): string {
  const bucket = `${siteId}:${action}`;
  const existing = turnKeys.get(bucket);
  if (existing) return existing;
  const key = `${action}-${randomSuffix()}`;
  turnKeys.set(bucket, key);
  return key;
}

export function resetIdempotencyKey(siteId: string, action: string): void {
  turnKeys.delete(`${siteId}:${action}`);
}
