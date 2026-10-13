/**
 * Redis-backed presence tracking.
 *
 * Online state is stored as a Redis key with a TTL. The key existing means
 * the user is online; TTL auto-expiry handles ungraceful disconnects without
 * any cleanup job.
 *
 * Key: presence:{userId} → ISO timestamp (lastSeenAt), TTL 90s
 *
 * On graceful disconnect the accounts table is also updated so the REST
 * profile endpoint can return persisted presence without a Redis round-trip.
 */
import * as accountRepo from "@patty/api/features/account/repository";
import { logger } from "@patty/api/lib/logger";
import { z } from "zod";

import { redis } from "./redis";

const PRESENCE_TTL_SECONDS = 90;

function presenceKey(userId: string): string {
  return `presence:${userId}`;
}

/**
 * Mark a user online (refresh TTL) or offline (delete key + sync DB).
 * Fire-and-forget safe — callers use `void setPresence(...)`.
 */
export async function setPresence(
  userId: string,
  online: boolean,
): Promise<void> {
  try {
    if (online) {
      // SET presence:{userId} {ISO} EX 90 — atomic upsert with expiry
      await redis.send("SET", [
        presenceKey(userId),
        new Date().toISOString(),
        "EX",
        String(PRESENCE_TTL_SECONDS),
      ]);
    } else {
      await redis.del(presenceKey(userId));
      // Sync final offline state to DB once — profile endpoint reads from DB.
      await accountRepo.setPresence(userId, false);
    }
  } catch (err) {
    logger.error({ err, userId, online }, "Presence update failed");
  }
}

/**
 * Returns live presence from Redis.
 * Falls back to { isOnline: false, lastSeenAt: null } on Redis errors so
 * callers can fall back to the DB snapshot.
 */
export async function getPresence(
  userId: string,
): Promise<{ isOnline: boolean; lastSeenAt: string | null }> {
  try {
    const val = await redis.get(presenceKey(userId));
    return { isOnline: val !== null, lastSeenAt: val };
  } catch (err) {
    logger.error({ err, userId }, "Presence read failed — falling back to DB");
    return { isOnline: false, lastSeenAt: null };
  }
}

/**
 * Batch-fetch live presence for multiple users in a single MGET.
 * Returns an empty map on Redis errors so callers fall back to DB values.
 */
export async function getPresenceBatch(
  userIds: string[],
): Promise<Map<string, { isOnline: boolean; lastSeenAt: string | null }>> {
  const result = new Map<
    string,
    { isOnline: boolean; lastSeenAt: string | null }
  >();
  if (userIds.length === 0) return result;
  try {
    const keys = userIds.map(presenceKey);
    const values = z
      .array(z.string().nullable())
      .parse(await redis.send("MGET", keys));
    for (let i = 0; i < userIds.length; i++) {
      const uid = userIds[i];
      const val = values[i] ?? null;
      if (uid === undefined) continue;
      result.set(uid, {
        isOnline: val !== null,
        lastSeenAt: val,
      });
    }
  } catch (err) {
    logger.error({ err }, "Presence batch read failed — falling back to DB");
  }
  return result;
}

/**
 * Count currently online users by scanning Redis presence keys.
 * Falls back to 0 on Redis errors.
 */
export async function countOnlineUsers(): Promise<number> {
  try {
    let count = 0;
    let cursor = "0";
    do {
      const result = z
        .tuple([z.string(), z.array(z.string())])
        .parse(
          await redis.send("SCAN", [
            cursor,
            "MATCH",
            "presence:*",
            "COUNT",
            "200",
          ]),
        );
      cursor = result[0];
      count += result[1].length;
    } while (cursor !== "0");
    return count;
  } catch (err) {
    logger.error({ err }, "countOnlineUsers Redis error — returning 0");
    return 0;
  }
}
