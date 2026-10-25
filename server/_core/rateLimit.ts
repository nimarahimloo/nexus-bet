/**
 * Fixed-window rate limiting backed by MySQL.
 *
 * In-memory counters would reset on every serverless cold start and would not
 * be shared between instances, which is exactly the deployment shape this app
 * targets. One row per bucket, and the window rolls over by rewriting
 * `windowStart`, so no cleanup job is required for correctness.
 */

import type { Request } from "express";
import { eq, lt, sql } from "drizzle-orm";
import { rateLimits } from "../../drizzle/schema";
import { getDb } from "../db/core";

export type RateLimitRule = { limit: number; windowMs: number };

export const RATE_LIMIT_RULES = {
  /** Password guessing against a known username, per IP. */
  login: { limit: 5, windowMs: 5 * 60_000 },
  signup: { limit: 3, windowMs: 60 * 60_000 },
  /** Reset-code requests, per IP — also stops mail/notification flooding. */
  resetRequest: { limit: 3, windowMs: 60 * 60_000 },
  /** Reset-code redemptions, per IP (on top of the per-token attempt counter). */
  resetSubmit: { limit: 5, windowMs: 15 * 60_000 },
  supportChatUser: { limit: 60, windowMs: 60 * 60_000 },
  /** Guests get a small taste; this is a paid inference endpoint. */
  supportChatGuest: { limit: 5, windowMs: 60 * 60_000 },
} as const;

export type RateLimitResult = {
  allowed: boolean;
  hits: number;
  limit: number;
  retryAfterMs: number;
};

export function windowStartFor(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export function clientIp(req: Request | undefined | null): string {
  if (!req) return "unknown";
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(",")[0]?.trim();
  return first || req.ip || req.socket?.remoteAddress || "unknown";
}

export function rateLimitKey(
  scope: string,
  identifier: string,
  discriminator?: string
) {
  return [scope, identifier, discriminator]
    .filter(part => Boolean(part))
    .join(":")
    .slice(0, 191);
}

export function evaluateHits(
  hits: number,
  rule: RateLimitRule,
  windowStart: Date,
  now: Date
): RateLimitResult {
  const allowed = hits <= rule.limit;
  return {
    allowed,
    hits,
    limit: rule.limit,
    retryAfterMs: allowed
      ? 0
      : Math.max(0, windowStart.getTime() + rule.windowMs - now.getTime()),
  };
}

/**
 * Counts one hit against `key` and reports whether it is still inside the rule.
 * Throws when the database is unreachable — callers on money paths should fail
 * loudly rather than silently dropping the limit.
 */
export async function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now = new Date()
): Promise<RateLimitResult> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  const windowStart = windowStartFor(now, rule.windowMs);
  await db
    .insert(rateLimits)
    .values({ bucketKey: key, windowStart, hits: 1 })
    .onDuplicateKeyUpdate({
      // Order matters: hits is evaluated against the *old* windowStart.
      set: {
        hits: sql`if(${rateLimits.windowStart} = ${windowStart}, ${rateLimits.hits} + 1, 1)`,
        windowStart: sql`${windowStart}`,
      },
    });

  const rows = await db
    .select({ hits: rateLimits.hits })
    .from(rateLimits)
    .where(eq(rateLimits.bucketKey, key))
    .limit(1);
  const hits = rows[0]?.hits ?? 1;
  return evaluateHits(hits, rule, windowStart, now);
}

/** Best-effort housekeeping; safe to call opportunistically. */
export async function purgeStaleBuckets(
  olderThanMs = 24 * 60 * 60 * 1000,
  now = new Date()
) {
  const db = await getDb();
  if (!db) return 0;
  const cutoff = new Date(now.getTime() - olderThanMs);
  const result = await db
    .delete(rateLimits)
    .where(lt(rateLimits.updatedAt, cutoff));
  return Number(
    (result as unknown as { affectedRows?: number }[])[0]?.affectedRows ?? 0
  );
}
