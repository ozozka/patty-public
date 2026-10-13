import "server-only";

import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "patty_admin_token";
const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET ?? "");

export interface AdminSession {
  adminId: string;
  role: "super_admin" | "moderator";
}

/**
 * Reads and verifies the admin JWT from the httpOnly cookie.
 * Returns null if not authenticated or token is invalid/expired.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    const rawRole = payload["role"];
    const role =
      rawRole === "super_admin" || rawRole === "moderator" ? rawRole : null;

    if (!sub || !role) {
      return null;
    }

    return { adminId: sub, role };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
