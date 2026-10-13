import type { Context } from "hono";

/** Extract the originating client IP from proxy headers. */
export function clientIp(c: Context): string | null {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    null
  );
}
