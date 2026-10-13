import { incrementRequestMetrics } from "@patty/api/lib/metrics";
import { createMiddleware } from "hono/factory";

/**
 * Global HTTP metrics middleware.
 * Records request count, error count, and response time in Redis.
 * Fails open — never blocks a response.
 */
export const metricsMiddleware = () =>
  createMiddleware(async (c, next) => {
    const start = Date.now();
    await next();
    const durationMs = Date.now() - start;
    const path = new URL(c.req.url).pathname;
    const method = c.req.method;
    const status = c.res.status;

    void incrementRequestMetrics(path, method, status, durationMs);
  });
