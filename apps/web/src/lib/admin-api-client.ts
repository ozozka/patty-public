import "server-only";

import type { AdminAppType } from "@patty/api/types";
import { hc } from "hono/client";
import { cookies } from "next/headers";

import { COOKIE_NAME } from "./auth";

const API_BASE = process.env.API_INTERNAL_URL ?? "http://localhost:8080";

/**
 * Returns a type-safe Hono RPC client for the admin API, with the admin JWT
 * automatically injected from the request cookie.
 * Must only be called in Server Components and Route Handlers.
 */
export async function getAdminClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";

  return hc<AdminAppType>(`${API_BASE}/api/v1/admin`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
}
