import { NextResponse } from "next/server";

export type RelayRouteKind = "live-token" | "score";

const LIMITS: Record<RelayRouteKind, { max: number; windowMs: number }> = {
  "live-token": { max: 40, windowMs: 60_000 },
  score: { max: 25, windowMs: 60 * 60_000 },
};

const buckets = new Map<string, { count: number; windowStart: number }>();

/**
 * Stable key: client IP (first x-forwarded-for hop) + optional X-Device-Id.
 */
export function relayRateLimitKey(request: Request): string {
  const deviceId =
    request.headers.get("x-device-id")?.trim().slice(0, 128) || "no-device";
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  return `${ip}:${deviceId}`;
}

/**
 * Fixed-window counter per key. Resets when the window elapses.
 * For multi-instance serverless, replace with Upstash / Redis.
 */
export function assertRelayRateLimit(
  request: Request,
  kind: RelayRouteKind,
): NextResponse | null {
  const key = `${kind}:${relayRateLimitKey(request)}`;
  const { max, windowMs } = LIMITS[kind];
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    b = { count: 0, windowStart: now };
    buckets.set(key, b);
  }
  if (b.count >= max) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  b.count += 1;
  return null;
}
