import "server-only";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Rate limiter for PUBLIC server actions (reservation create / submit /
 * uploads).
 *
 * Primary limiter: PERSISTENT + DISTRIBUTED, backed by Postgres (the RateLimitHit
 * table) through Prisma — the infrastructure the app already uses. On serverless
 * (Vercel) every instance shares this table, so the limit is enforced GLOBALLY,
 * not per-instance. A fixed window is used: one counter row per
 * (bucket, identifier, windowStart), incremented atomically.
 *
 * Fallback: if the database is briefly unavailable, we fall back to a per-
 * instance in-memory counter so abuse is still slowed AND legitimate users are
 * never hard-blocked by a limiter outage (fail-safe for security without taking
 * the whole reservation flow down).
 *
 * The limiter NEVER throws. On total failure it fails OPEN (allows the request)
 * so a limiter bug can never break a legitimate reservation.
 */

type Entry = { count: number; resetAt: number };

const globalForRl = globalThis as unknown as { __rlStore?: Map<string, Entry> };
const memStore: Map<string, Entry> = globalForRl.__rlStore ?? new Map();
globalForRl.__rlStore = memStore;

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();
    return h.get("x-real-ip")?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

export interface RateLimitOptions {
  /** Logical bucket, e.g. "reservation:create". */
  bucket: string;
  /** Max allowed requests within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets (for messaging). */
  retryAfter: number;
}

/**
 * Distributed fixed-window rate limit. Increments the shared counter for the
 * current window and denies once it exceeds `limit`. Falls back to in-memory on
 * DB error, and fails open on total failure.
 */
export async function rateLimit({ bucket, limit, windowMs }: RateLimitOptions): Promise<RateLimitResult> {
  let ip = "unknown";
  try {
    ip = await getClientIp();
  } catch {
    /* ignore — ip stays "unknown" */
  }

  const now = Date.now();
  const windowStart = now - (now % windowMs);
  const resetAt = windowStart + windowMs;
  const retryAfter = Math.max(1, Math.ceil((resetAt - now) / 1000));

  // --- Primary: distributed counter in Postgres (atomic upsert + increment) ---
  try {
    const row = await prisma.rateLimitHit.upsert({
      where: {
        bucket_identifier_windowStart: {
          bucket,
          identifier: ip,
          windowStart: BigInt(windowStart),
        },
      },
      create: { bucket, identifier: ip, windowStart: BigInt(windowStart), count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    // Opportunistic cleanup of old windows (best-effort, non-blocking).
    if (row.count === 1) {
      prisma.rateLimitHit
        .deleteMany({ where: { windowStart: { lt: BigInt(windowStart - windowMs * 5) } } })
        .catch(() => {});
    }

    if (row.count > limit) return { allowed: false, retryAfter };
    return { allowed: true, retryAfter: 0 };
  } catch (dbError) {
    console.error("rateLimit DB path failed, falling back to in-memory:", dbError);
  }

  // --- Fallback: per-instance in-memory fixed window ---
  try {
    const key = `${bucket}:${ip}`;
    const entry = memStore.get(key);
    if (!entry || now >= entry.resetAt) {
      memStore.set(key, { count: 1, resetAt });
      if (memStore.size > 5000) {
        for (const [k, v] of memStore) if (now >= v.resetAt) memStore.delete(k);
      }
      return { allowed: true, retryAfter: 0 };
    }
    if (entry.count >= limit) return { allowed: false, retryAfter };
    entry.count += 1;
    return { allowed: true, retryAfter: 0 };
  } catch {
    // Fail open: never block a legitimate user due to a limiter error.
    return { allowed: true, retryAfter: 0 };
  }
}
