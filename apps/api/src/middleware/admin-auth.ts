import { verifyAdminToken } from "@patty/api/lib/admin-jwt";
import { AppError } from "@patty/api/lib/errors";
import { logger } from "@patty/api/lib/logger";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";

export interface AdminVariables {
  adminId: string;
  adminRole: "super_admin" | "moderator";
}

export type AdminContext = Context<{ Variables: AdminVariables }>;

/**
 * Extracts and verifies the admin JWT from the Authorization header.
 * Sets `c.var.adminId` and `c.var.adminRole` for downstream handlers.
 *
 * Only accepts tokens with `type === "admin"`.
 */
export const adminAuthMiddleware = createMiddleware<{
  Variables: AdminVariables;
}>(async (c: AdminContext, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw AppError.unauthorized("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAdminToken(token);
    if (!payload.sub) throw AppError.unauthorized("Invalid token payload");
    if (payload.type !== "admin")
      throw AppError.unauthorized("Invalid token type");

    c.set("adminId", payload.sub);
    c.set("adminRole", payload.role);
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn({ err }, "Admin JWT verification failed");
    throw AppError.unauthorized("Invalid or expired admin token");
  }

  await next();
});
