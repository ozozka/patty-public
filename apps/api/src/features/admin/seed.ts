import { db } from "@patty/api/db/client";
import { adminAccounts } from "@patty/api/db/schema/admin";
import { env } from "@patty/api/env";
import { logger } from "@patty/api/lib/logger";

export async function seedInitialSuperAdmin() {
  if (!env.INITIAL_SUPER_ADMIN_EMAIL || !env.INITIAL_SUPER_ADMIN_PASSWORD) {
    return;
  }

  try {
    const hash = await Bun.password.hash(env.INITIAL_SUPER_ADMIN_PASSWORD);

    await db
      .insert(adminAccounts)
      .values({
        email: env.INITIAL_SUPER_ADMIN_EMAIL,
        password: hash,
        role: "super_admin",
      })
      .onConflictDoUpdate({
        target: adminAccounts.email,
        set: { password: hash },
      });
  } catch (error) {
    // Log but do not crash the app, this is best-effort seeding
    logger.error({ err: error }, "Failed to seed initial super admin:");
  }
}
