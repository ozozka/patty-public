import { RedisClient } from "bun";

import { env } from "../env";

/** Command client — used for GET, SET, INCR, PUBLISH, EVAL, etc. */
export const redis = new RedisClient(env.REDIS_URL);

/**
 * Dedicated subscriber client.
 * Redis protocol requires a separate connection once in subscribe mode —
 * a subscribed client can only issue (P)SUBSCRIBE / (P)UNSUBSCRIBE commands.
 */
export const redisSub = new RedisClient(env.REDIS_URL);

/** Verify connectivity at startup. Throws if Redis is unreachable. */
export async function connectRedis(): Promise<void> {
  await redis.ping();
  await redisSub.ping();
}
