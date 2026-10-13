import { db } from "@patty/api/db/client";
import { accounts } from "@patty/api/db/schema/accounts";
import { AppError } from "@patty/api/lib/errors";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";

import type { AuthVariables } from "./auth";

/**
 * Ensures the authenticated user has a 'verified' status.
 * Must be used AFTER authMiddleware.
 */
export const verifiedMiddleware = createMiddleware<{
  Variables: AuthVariables;
}>(async (c: Context, next: Next) => {
  const userId = c.var.userId;
  if (!userId) {
    throw AppError.unauthorized("User not authenticated");
  }

  const [user] = await db
    .select({ status: accounts.status })
    .from(accounts)
    .where(eq(accounts.id, userId))
    .limit(1);

  if (!user) {
    throw AppError.unauthorized("User not found");
  }

  if (user.status === "banned") {
    throw AppError.forbidden("User account is banned");
  }

  if (user.status !== "verified") {
    throw AppError.forbidden("Email verification required");
  }

  await next();
});
