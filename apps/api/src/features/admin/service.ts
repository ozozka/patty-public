import { signAdminToken } from "@patty/api/lib/admin-jwt";
import { AppError } from "@patty/api/lib/errors";
import { logger } from "@patty/api/lib/logger";
import { redis } from "@patty/api/lib/redis";

import * as repo from "./repository";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Authenticates an admin and returns a signed JWT.
 * Throws 401 on invalid credentials.
 */
export async function login(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const admin = await repo.findAdminByEmail(email.toLowerCase());
  if (!admin) throw AppError.unauthorized("Invalid credentials");

  const valid = await Bun.password.verify(password, admin.password);
  if (!valid) throw AppError.unauthorized("Invalid credentials");

  const token = await signAdminToken(admin.id, admin.role);
  logger.info(
    { adminId: admin.id, role: admin.role },
    "Admin login successful",
  );

  return { token };
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function listReports(opts: {
  page: number;
  perPage: number;
  status?: "pending" | "reviewed" | "resolved" | "dismissed";
}) {
  return repo.listReports(opts);
}

export async function getReport(id: string) {
  const report = await repo.getReportById(id);
  if (!report) throw AppError.notFound("Report not found");
  return report;
}

export async function updateReport(
  id: string,
  status: "reviewed" | "resolved" | "dismissed",
) {
  const existing = await repo.getReportById(id);
  if (!existing) throw AppError.notFound("Report not found");
  await repo.updateReportStatus(id, status);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

const STATS_TTL_S = 30 * 60; // 30 minutes

async function cachedStats<T>(key: string, fn: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      // JSON.parse returns `any` — assignable to T without assertion
      return JSON.parse(cached);
    }
  } catch {
    // Fail open on cache miss
  }

  const result = await fn();

  try {
    await redis.send("SET", [
      key,
      JSON.stringify(result),
      "EX",
      String(STATS_TTL_S),
    ]);
  } catch {
    // Ignore cache write failures
  }

  return result;
}

export async function getStatsOverview() {
  return cachedStats("cache:admin:stats:overview", repo.getStatsOverview);
}

export async function getStatsGrowth() {
  return cachedStats("cache:admin:stats:growth", repo.getStatsGrowth);
}

export async function getStatsActivity() {
  return cachedStats("cache:admin:stats:activity", repo.getStatsActivity);
}

export async function getStatsReports() {
  return cachedStats("cache:admin:stats:reports", repo.getStatsReports);
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export async function getMetrics() {
  return repo.getMetrics();
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export async function listAccounts(opts: {
  page: number;
  perPage: number;
  search?: string;
  status?: "unverified" | "verified" | "banned";
}) {
  return repo.listAccounts(opts);
}

export async function getAccount(id: string) {
  const account = await repo.getAccountById(id);
  if (!account) throw AppError.notFound("Account not found");
  return account;
}

export async function updateAccountStatus(
  id: string,
  status: "verified" | "banned" | "unverified",
) {
  const existing = await repo.getAccountById(id);
  if (!existing) throw AppError.notFound("Account not found");
  await repo.updateAccountStatus(id, status);
}
