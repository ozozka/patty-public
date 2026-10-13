import { logger } from "@patty/api/lib/logger";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";

/**
 * Hono middleware to log incoming requests and outgoing responses using Pino.
 */
export const loggerMiddleware = () =>
  createMiddleware(async (c: Context, next: Next) => {
    const start = Date.now();
    const req = c.req;

    logger.info(
      {
        method: req.method,
        url: req.url,
        ip:
          req.header("x-forwarded-for") ?? req.header("x-real-ip") ?? "unknown",
      },
      "Incoming Request",
    );

    await next();

    const ms = Date.now() - start;
    const res = c.res;

    logger.info(
      {
        method: req.method,
        url: req.url,
        status: res.status,
        duration: `${ms}ms`,
      },
      "Request Completed",
    );
  });
