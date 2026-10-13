import { env } from "@patty/api/env";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

const adminSecret = new TextEncoder().encode(env.ADMIN_JWT_SECRET);

const adminJwtPayloadSchema = z.object({
  sub: z.string(),
  type: z.literal("admin"),
  role: z.enum(["super_admin", "moderator"]),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export interface AdminJwtPayload {
  sub: string;
  type: "admin";
  role: "super_admin" | "moderator";
  iat?: number;
  exp?: number;
}

/**
 * Signs a long-lived admin access token (7 days).
 * Carries `type: "admin"` to distinguish from user tokens.
 */
export async function signAdminToken(
  adminId: string,
  role: "super_admin" | "moderator",
): Promise<string> {
  return new SignJWT({ sub: adminId, type: "admin", role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(adminSecret);
}

/**
 * Verifies an admin JWT. Throws if invalid, expired, or wrong type.
 */
export async function verifyAdminToken(
  token: string,
): Promise<AdminJwtPayload> {
  const { payload } = await jwtVerify(token, adminSecret);
  return adminJwtPayloadSchema.parse(payload);
}
