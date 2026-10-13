import { AppError } from "@patty/api/lib/errors";
import { verifyToken } from "@patty/api/lib/jwt";
import { logger } from "@patty/api/lib/logger";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";

export interface AuthVariables {
  userId: string;
}

export type AuthContext = Context<{ Variables: AuthVariables }>;

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Sets `c.var.userId` for downstream handlers.
 *
 * Only accepts access tokens (type=access) or legacy tokens (no type).
 * Refresh tokens are rejected to prevent misuse.
 */
export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c: AuthContext, next: Next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw AppError.unauthorized("Missing or invalid Authorization header");
    }

    const token = authHeader.slice(7);
    try {
      const payload = await verifyToken(token);
      if (!payload.sub) throw AppError.unauthorized("Invalid token payload");

      // Reject refresh tokens in Authorization header
      if (payload.type === "refresh") {
        throw AppError.unauthorized("Invalid token type");
      }

      c.set("userId", payload.sub);
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.warn({ err }, "JWT verification failed");
      throw AppError.unauthorized("Invalid or expired token");
    }

    await next();
  },
);
