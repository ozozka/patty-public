import { AppError } from "@patty/api/lib/errors";
import { logger } from "@patty/api/lib/logger";
import type { Context } from "hono";

/**
 * Global error handler middleware.
 * Converts AppError instances to structured JSON responses.
 */
export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.code,
        message: err.message,
        ...(err.context !== undefined && { context: err.context }),
        ...(err.fieldErrors !== undefined && { field_errors: err.fieldErrors }),
      },
      err.status,
    );
  }

  logger.error(
    { err, path: c.req.path, method: c.req.method },
    "Unhandled error",
  );
  return c.json({ error: "INTERNAL", message: "Internal server error" }, 500);
}
