import { db } from "@patty/api/db/client";
import { adminAccounts } from "@patty/api/db/schema/admin";
import { signAdminToken } from "@patty/api/lib/admin-jwt";

export const DEFAULT_ADMIN_PASSWORD = "AdminSecret123!";

// Cached once per test process — Bun.password.hash is intentionally slow.
let _defaultAdminPasswordHash: string | undefined;
async function getDefaultAdminPasswordHash(): Promise<string> {
  _defaultAdminPasswordHash ??= await Bun.password.hash(DEFAULT_ADMIN_PASSWORD);
  return _defaultAdminPasswordHash;
}

export async function createTestAdmin(overrides?: {
  email?: string;
  password?: string;
  role?: "super_admin" | "moderator";
}): Promise<{ id: string; email: string }> {
  const email = overrides?.email ?? `admin-${crypto.randomUUID()}@test.com`;
  const password = overrides?.password ?? DEFAULT_ADMIN_PASSWORD;
  const hash =
    overrides?.password !== undefined
      ? await Bun.password.hash(password)
      : await getDefaultAdminPasswordHash();

  const [admin] = await db
    .insert(adminAccounts)
    .values({ email, password: hash, role: overrides?.role ?? "super_admin" })
    .returning({ id: adminAccounts.id });

  if (!admin) {
    throw new Error("Failed to create test admin account");
  }

  return { id: admin.id, email };
}

export async function generateAdminAuthHeader(
  adminId: string,
  role: "super_admin" | "moderator" = "super_admin",
): Promise<Record<string, string>> {
  const token = await signAdminToken(adminId, role);
  return { Authorization: `Bearer ${token}` };
}
