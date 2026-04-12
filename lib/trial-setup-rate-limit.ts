/**
 * Simple in-memory rate limit for anonymous trial setup (per client IP).
 * Resets entries lazily; suitable for single-instance deployments.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_TRIALS_PER_WINDOW = 20;

type Bucket = { count: number; windowStart: number };

const buckets = new Map<string, Bucket>();

function pruneBucket(key: string, bucket: Bucket, now: number): Bucket {
  if (now - bucket.windowStart >= WINDOW_MS) {
    return { count: 0, windowStart: now };
  }
  return bucket;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  return "unknown";
}

/**
 * @returns null if allowed, or a short message if rate limited
 */
export function checkTrialSetupRateLimit(clientIp: string): string | null {
  const now = Date.now();
  const key = clientIp || "unknown";
  let bucket = buckets.get(key) ?? { count: 0, windowStart: now };
  bucket = pruneBucket(key, bucket, now);
  if (bucket.count >= MAX_TRIALS_PER_WINDOW) {
    return "Too many trial starts. Please try again later.";
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  return null;
}

/** @internal testing */
export function resetTrialSetupRateLimitForTests(): void {
  buckets.clear();
}
