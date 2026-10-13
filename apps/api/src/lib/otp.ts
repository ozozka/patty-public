import { env } from "@patty/api/env";
import { randomInt, timingSafeEqual } from "crypto";

/** Generates a cryptographically secure random 6-digit numeric OTP code. */
export function generateOtp(): string {
  if (env.NODE_ENV === "development") {
    return "123456";
  }
  return String(randomInt(100000, 1000000));
}

/** Constant-time string comparison to prevent timing attacks. */
export function constantTimeEq(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against self to maintain constant time regardless of length mismatch
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
