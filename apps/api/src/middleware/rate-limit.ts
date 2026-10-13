import { clientIp } from "@patty/api/lib/client-ip";
import { AppError } from "@patty/api/lib/errors";
import { checkRateLimit } from "@patty/api/lib/rate-limiter";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";

import type { AuthVariables } from "./auth";

interface RateLimitOptions {
  /** Maximum requests allowed per window. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
  /** Custom key extractor. Defaults to client IP. */
  keyFn?: (c: Context<{ Variables: AuthVariables }>) => string;
}

const isTest = process.env.NODE_ENV === "test";

/**
 * Hono middleware factory for HTTP rate limiting.
 *
 * Returns standard rate-limit headers on every response and throws
 * `AppError.rateLimited()` (429) when the limit is exceeded.
 *
 * Bypassed in the test environment so integration tests don't collide
 * on a shared IP key.
 */
export function rateLimitMiddleware(opts: RateLimitOptions) {
  return createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
    if (isTest) {
      await next();
      return;
    }

    const key = opts.keyFn?.(c) ?? `ip:${clientIp(c) ?? "unknown"}`;
    const result = await checkRateLimit(key, opts.max, opts.windowMs);

    c.header("RateLimit-Limit", String(opts.max));
    c.header("RateLimit-Remaining", String(result.remaining));
    c.header("RateLimit-Reset", String(result.resetAt));

    if (!result.allowed) {
      c.header("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
      throw AppError.rateLimited("Too many requests. Try again later.");
    }

    await next();
  });
}
