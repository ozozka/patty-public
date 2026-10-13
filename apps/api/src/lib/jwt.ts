import { env } from "@patty/api/env";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

const secret = new TextEncoder().encode(env.JWT_SECRET);

const jwtPayloadSchema = z.object({
  sub: z.string(),
  tv: z.number().optional(),
  type: z.enum(["access", "refresh"]).optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export interface JwtPayload {
  sub: string;
  tv?: number;
  type?: "access" | "refresh";
  iat?: number;
  exp?: number;
}

/**
 * Signs a short-lived access token (15 minutes).
 * Includes `tv` (token version) for revocation support.
 */
export async function signAccessToken(
  userId: string,
  tokenVersion: number,
): Promise<string> {
  return new SignJWT({ sub: userId, tv: tokenVersion, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

/**
 * Signs a long-lived refresh token (30 days).
 * Includes `tv` (token version) for revocation support.
 */
export async function signRefreshToken(
  userId: string,
  tokenVersion: number,
): Promise<string> {
  return new SignJWT({ sub: userId, tv: tokenVersion, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

/**
 * Verifies a JWT token and returns the payload.
 * Throws if the token is invalid or expired.
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return jwtPayloadSchema.parse(payload);
}
