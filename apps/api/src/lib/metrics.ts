/**
 * HTTP request metrics via Redis.
 *
 * Key schema (expire 8 days):
 *   metrics:req:{YYYY-MM-DD}:{normalizedPath}:{METHOD}:count   → INCR
 *   metrics:req:{YYYY-MM-DD}:{normalizedPath}:{METHOD}:errors  → INCR
 *   metrics:req:{YYYY-MM-DD}:{normalizedPath}:{METHOD}:ms_sum  → INCRBY
 *
 * A nightly flush job sweeps yesterday's keys into `metrics_snapshots`.
 */
import { db } from "@patty/api/db/client";
import { metricsSnapshots } from "@patty/api/db/schema";
import { logger } from "@patty/api/lib/logger";
import { sql } from "drizzle-orm";
import { z } from "zod";

import { redis } from "./redis";

const TTL_MS = 8 * 24 * 60 * 60 * 1000; // 8 days in ms
const TTL_S = Math.floor(TTL_MS / 1000);

const INCR_SCRIPT = `
  local c = redis.call('INCRBY', KEYS[1], ARGV[1])
  if c == tonumber(ARGV[1]) then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
  end
  return c
`;

/**
 * Replaces UUIDs and pure numeric segments in a path to avoid cardinality explosion.
 *
 * /api/v1/matches/abc123.../messages → /api/v1/matches/:id/messages
 * /api/v1/pets/42 → /api/v1/pets/:n
 */
export function normalizePath(path: string): string {
  return path
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ":id",
    )
    .replace(/\/\d+/g, "/:n");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Atomically increments Redis counters for a single request.
 * Fails open — a Redis outage must not block the response.
 */
export async function incrementRequestMetrics(
  path: string,
  method: string,
  status: number,
  durationMs: number,
): Promise<void> {
  const day = todayKey();
  const norm = normalizePath(path);
  const prefix = `metrics:req:${day}:${norm}:${method.toUpperCase()}`;

  try {
    const isError = status >= 400 ? 1 : 0;

    await Promise.all([
      redis.send("EVAL", [
        INCR_SCRIPT,
        "1",
        `${prefix}:count`,
        "1",
        String(TTL_S),
      ]),
      ...(isError
        ? [
            redis.send("EVAL", [
              INCR_SCRIPT,
              "1",
              `${prefix}:errors`,
              "1",
              String(TTL_S),
            ]),
          ]
        : []),
      redis.send("EVAL", [
        INCR_SCRIPT,
        "1",
        `${prefix}:ms_sum`,
        String(Math.round(durationMs)),
        String(TTL_S),
      ]),
    ]);
  } catch (err) {
    logger.error(
      { err, path, method, status },
      "metrics: Redis error — failing open",
    );
  }
}

// ---------------------------------------------------------------------------
// Nightly flush
// ---------------------------------------------------------------------------

/**
 * Sweeps yesterday's Redis metric keys into the `metrics_snapshots` table.
 * Designed to run once per day. Idempotent via ON CONFLICT DO UPDATE.
 */
export async function flushMetricsToDb(): Promise<void> {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const day = yesterday.toISOString().slice(0, 10);

  try {
    // Scan for all keys matching yesterday's prefix
    const pattern = `metrics:req:${day}:*:count`;
    let cursor = "0";
    const countKeys: string[] = [];

    do {
      const result: unknown = await redis.send("SCAN", [
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        "200",
      ]);
      if (!Array.isArray(result)) break;
      const [nextCursor, keys] = z
        .tuple([z.string(), z.array(z.string())])
        .parse(result);
      cursor = nextCursor;
      countKeys.push(...keys);
    } while (cursor !== "0");

    if (countKeys.length === 0) return;

    const rows: Array<{
      date: string;
      path: string;
      method: string;
      requestCount: number;
      errorCount: number;
      totalMs: number;
    }> = [];

    for (const countKey of countKeys) {
      // Extract path and method from key: metrics:req:{day}:{path}:{METHOD}:count
      const withoutPrefix = countKey.replace(`metrics:req:${day}:`, "");
      const lastColon = withoutPrefix.lastIndexOf(":");
      const pathAndMethod = withoutPrefix.slice(0, lastColon);
      const methodStart = pathAndMethod.lastIndexOf(":");
      const method = pathAndMethod.slice(methodStart + 1);
      const path = pathAndMethod.slice(0, methodStart);

      const base = `metrics:req:${day}:${path}:${method}`;
      const [rawCount, rawErrors, rawMs] = await Promise.all([
        redis.get(`${base}:count`),
        redis.get(`${base}:errors`),
        redis.get(`${base}:ms_sum`),
      ]);

      rows.push({
        date: day,
        path,
        method,
        requestCount: parseInt(rawCount ?? "0", 10),
        errorCount: parseInt(rawErrors ?? "0", 10),
        totalMs: parseInt(rawMs ?? "0", 10),
      });
    }

    if (rows.length === 0) return;

    await db
      .insert(metricsSnapshots)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          metricsSnapshots.date,
          metricsSnapshots.path,
          metricsSnapshots.method,
        ],
        set: {
          requestCount: sql`excluded.request_count`,
          errorCount: sql`excluded.error_count`,
          totalMs: sql`excluded.total_ms`,
        },
      });

    logger.info({ day, rows: rows.length }, "metrics: flushed to DB");
  } catch (err) {
    logger.error({ err, day }, "metrics: flush failed");
  }
}
