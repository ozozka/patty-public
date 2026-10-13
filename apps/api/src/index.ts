import { Hono } from "hono";
import { websocket } from "hono/bun";

import { runMigrations } from "./db/migrate";
import { env } from "./env";
import { seedInitialSuperAdmin } from "./features/admin/seed";
import { registerEventListeners } from "./lib/events";
import { logger } from "./lib/logger";
import { flushMetricsToDb } from "./lib/metrics";
import { connectRedis } from "./lib/redis";
import type { AuthVariables } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { loggerMiddleware } from "./middleware/logger";
import { metricsMiddleware } from "./middleware/metrics";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { adminApiRoutes, apiRoutes } from "./router";
import { wsApp } from "./ws/handler";

type Env = { Variables: AuthVariables };

const app = new Hono<Env>();

// Global middleware
app.use("*", loggerMiddleware());
app.use("*", metricsMiddleware());
app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("X-XSS-Protection", "1; mode=block");
  await next();
});

// Health check (before rate limiter — always reachable)
app.get("/api/v1/health", (c) => c.text("OK"));

// Global rate limit — applies to all routes below this point
app.use(
  "/api/v1/*",
  rateLimitMiddleware({
    max: env.RATE_LIMIT_GLOBAL_MAX,
    windowMs: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
  }),
);

// Mount API routes on app so integration tests using `app` see all routes.
app.route("/", apiRoutes);
app.route("/api/v1/admin", adminApiRoutes);

// Combine HTTP routes and WebSocket routes
const combinedApp = new Hono<Env>().route("/", app).route("/api/v1/ws", wsApp);

export { adminApiRoutes, apiRoutes, app };
export type { AdminAppType, AppType } from "./router";

// Global error handler on both app (tests) and combinedApp (server)
app.onError(errorHandler);
combinedApp.onError(errorHandler);

const port = env.PORT;
logger.info({ port }, "Patty API starting");

if (process.env.NODE_ENV !== "test") {
  await connectRedis();
  await runMigrations();
  await seedInitialSuperAdmin();
  registerEventListeners();

  // Flush metrics to DB once per day at 01:00 UTC
  const msUntil1am = (() => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(1, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
    return next.getTime() - now.getTime();
  })();

  setTimeout(() => {
    void flushMetricsToDb();
    setInterval(
      () => {
        void flushMetricsToDb();
      },
      24 * 60 * 60 * 1000,
    );
  }, msUntil1am);
}

// Start Bun server with WebSocket support
export default {
  port,
  fetch: combinedApp.fetch,
  websocket,
  // Reject request bodies larger than 1 MB to prevent DoS via large payloads.
  maxRequestBodySize: 1024 * 1024,
};
