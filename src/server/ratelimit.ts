// Port of backend/studio/ratelimit.py — sliding window over auth endpoints.
// ponytail: in-memory, single-process only, same as the Python original.
const buckets = new Map<string, number[]>();

function prune(key: string, windowS: number): number[] {
  const now = Date.now() / 1000;
  const bucket = (buckets.get(key) ?? []).filter((ts) => now - ts < windowS);
  buckets.set(key, bucket);
  return bucket;
}

export function allow(key: string, limit: number, windowS: number): boolean {
  const bucket = prune(key, windowS);
  if (bucket.length >= limit) return false;
  bucket.push(Date.now() / 1000);
  return true;
}

export function retryAfter(key: string, windowS: number): number {
  const bucket = prune(key, windowS);
  if (!bucket.length) return 0;
  return Math.max(1, Math.floor(windowS - (Date.now() / 1000 - bucket[0])));
}

export function resetForTests(): void {
  buckets.clear();
}
