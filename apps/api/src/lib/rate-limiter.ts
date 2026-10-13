/**
 * Redis-backed rate limiters.
 *
 * 1. Login brute-force limiter — fixed window counter with lockout semantics.
 * 2. Generic rate limiter — fixed window counter for HTTP and WS rate limiting.
 *
 * Redis TTL handles expiry automatically — no cleanup job needed.
 */
import { logger } from "@patty/api/lib/logger";

import { redis } from "./redis";

// ---------------------------------------------------------------------------
// Login brute-force limiter
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60_000; // 15 minutes
const LOCKOUT_MS = 15 * 60_000; // 15-minute lockout after max attempts

/**
 * Atomically increment a counter and set expiry only on the first increment.
 * Prevents the race where two concurrent first-requests both try to set TTL.
 */
const INCR_WITH_EXPIRY_SCRIPT = `
  local c = redis.call('INCR', KEYS[1])
  if c == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  return c
`;

/**
 * Check and record a login attempt.
 * Throws LoginRateLimitError if rate limited or locked out.
 *
 * Fails open on Redis errors — a Redis outage allows attempts through rather
 * than returning 500s to all users. The HTTP rate limit middleware provides a
 * secondary defence during an outage.
 */
export async function checkLoginRateLimit(key: string): Promise<void> {
  try {
    const lockKey = `lrl:${key}:locked`;
    const attemptsKey = `lrl:${key}:attempts`;

    // Check lockout before incrementing — locked key contains the unlock epoch ms.
    const lockedStr = await redis.get(lockKey);
    if (lockedStr !== null) {
      const lockedUntilMs = parseInt(lockedStr, 10);
      const remainingSec = Math.ceil((lockedUntilMs - Date.now()) / 1000);
      throw new LoginRateLimitError(Math.max(remainingSec, 1));
    }

    const rawCount: unknown = await redis.send("EVAL", [
      INCR_WITH_EXPIRY_SCRIPT,
      "1",
      attemptsKey,
      String(WINDOW_MS),
    ]);
    const count = typeof rawCount === "number" ? rawCount : 0;

    if (count > MAX_ATTEMPTS) {
      const lockedUntilMs = Date.now() + LOCKOUT_MS;
      const lockSeconds = Math.ceil(LOCKOUT_MS / 1000);
      await redis.send("SET", [
        lockKey,
        String(lockedUntilMs),
        "EX",
        String(lockSeconds),
      ]);
      throw new LoginRateLimitError(lockSeconds);
    }
  } catch (err) {
    // Re-throw LoginRateLimitError — it is a valid business outcome, not an infra error.
    if (err instanceof LoginRateLimitError) throw err;
    // Redis error — fail open so a Redis outage does not lock all users out.
    logger.error({ err, key }, "Login rate limiter Redis error — failing open");
  }
}

/** Clear rate limit entries for a key (call on successful login). */
export async function clearLoginRateLimit(key: string): Promise<void> {
  try {
    await redis.send("DEL", [`lrl:${key}:attempts`, `lrl:${key}:locked`]);
  } catch (err) {
    logger.error({ err, key }, "clearLoginRateLimit Redis error — ignoring");
  }
}

export class LoginRateLimitError extends Error {
  readonly remainingSeconds: number;
  constructor(remainingSeconds: number) {
    super(`Too many login attempts. Try again in ${remainingSeconds} seconds.`);
    this.name = "LoginRateLimitError";
    this.remainingSeconds = remainingSeconds;
  }
}

// ---------------------------------------------------------------------------
// Generic fixed-window rate limiter
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch seconds when the current window resets
  retryAfterMs: number; // ms until the window resets (0 if allowed)
}

/**
 * Check (and consume) one token from a fixed-window rate limit bucket.
 *
 * If Redis is unreachable the request is allowed (fail-open) so that a
 * Redis outage does not take down the API.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  try {
    const rlKey = `rl:${key}`;

    const rawCount: unknown = await redis.send("EVAL", [
      INCR_WITH_EXPIRY_SCRIPT,
      "1",
      rlKey,
      String(windowMs),
    ]);
    const count = typeof rawCount === "number" ? rawCount : 0;

    const rawPttl: unknown = await redis.send("PTTL", [rlKey]);
    const pttl = typeof rawPttl === "number" ? rawPttl : windowMs;
    const resetAt = Math.ceil(
      (Date.now() + (pttl > 0 ? pttl : windowMs)) / 1000,
    );

    if (count > max) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterMs: pttl > 0 ? pttl : windowMs,
      };
    }

    return {
      allowed: true,
      remaining: max - count,
      resetAt,
      retryAfterMs: 0,
    };
  } catch (err) {
    // Fail open — a Redis outage should not bring down the API.
    logger.error({ err, key }, "Rate limiter Redis error — failing open");
    return {
      allowed: true,
      remaining: max,
      resetAt: Math.ceil((Date.now() + windowMs) / 1000),
      retryAfterMs: 0,
    };
  }
}
