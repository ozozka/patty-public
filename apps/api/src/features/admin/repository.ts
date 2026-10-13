import { db } from "@patty/api/db/client";
import {
  accounts,
  adminAccounts,
  metricsSnapshots,
  pets,
  reports,
} from "@patty/api/db/schema";
import { countOnlineUsers } from "@patty/api/lib/presence";
import { redis } from "@patty/api/lib/redis";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";

const reportTargetTypeSchema = z.enum(["account", "pet", "message"]);
const reportReasonSchema = z.enum([
  "spam",
  "inappropriate",
  "harassment",
  "fraud",
  "other",
]);
const reportStatusSchema = z.enum([
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);
const reportMetadataSchema = z.record(z.unknown()).catch({});

// ---------------------------------------------------------------------------
// Admin account auth
// ---------------------------------------------------------------------------

export interface AdminAccountRow {
  id: string;
  email: string;
  password: string;
  role: "super_admin" | "moderator";
}

export async function findAdminByEmail(
  email: string,
): Promise<AdminAccountRow | undefined> {
  const rows = await db
    .select({
      id: adminAccounts.id,
      email: adminAccounts.email,
      password: adminAccounts.password,
      role: adminAccounts.role,
    })
    .from(adminAccounts)
    .where(eq(adminAccounts.email, email))
    .limit(1);

  return rows[0];
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export interface ReportListItem {
  id: string;
  reporter_id: string;
  reporter_username: string;
  target_type: "account" | "pet" | "message";
  target_account_id: string | null;
  target_pet_id: string | null;
  target_message_id: string | null;
  target_username: string | null;
  reason: "spam" | "inappropriate" | "harassment" | "fraud" | "other";
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
}

export async function listReports(opts: {
  page: number;
  perPage: number;
  status?: "pending" | "reviewed" | "resolved" | "dismissed";
}): Promise<{ items: ReportListItem[]; total: number }> {
  const offset = (opts.page - 1) * opts.perPage;

  type RawRow = Record<string, unknown> & {
    id: string;
    reporter_id: string;
    reporter_username: string;
    target_type: string;
    target_account_id: string | null;
    target_pet_id: string | null;
    target_message_id: string | null;
    target_username: string | null;
    reason: string;
    status: string;
    created_at: Date;
    resolved_at: Date | null;
  };

  const whereClause = opts.status
    ? sql`r.status = ${opts.status}::report_status`
    : sql`TRUE`;

  const rows = await db.execute<RawRow>(sql`
    SELECT
      r.id,
      r.reporter_id,
      reporter.username AS reporter_username,
      r.target_type::text,
      r.target_account_id,
      r.target_pet_id,
      r.target_message_id,
      target_acc.username AS target_username,
      r.reason::text,
      r.status::text,
      r.created_at,
      r.resolved_at
    FROM reports r
    JOIN accounts reporter ON reporter.id = r.reporter_id
    LEFT JOIN accounts target_acc ON target_acc.id = r.target_account_id
    WHERE ${whereClause}
    ORDER BY r.created_at DESC
    LIMIT ${opts.perPage} OFFSET ${offset}
  `);

  const totalRows = await db.execute<
    Record<string, unknown> & { cnt: string }
  >(sql`
    SELECT COUNT(*)::text AS cnt FROM reports r
    WHERE ${whereClause}
  `);

  const items: ReportListItem[] = rows.map((r) => ({
    id: r.id,
    reporter_id: r.reporter_id,
    reporter_username: r.reporter_username,
    target_type: reportTargetTypeSchema.parse(r.target_type),
    target_account_id: r.target_account_id,
    target_pet_id: r.target_pet_id,
    target_message_id: r.target_message_id,
    target_username: r.target_username,
    reason: reportReasonSchema.parse(r.reason),
    status: reportStatusSchema.parse(r.status),
    created_at: new Date(r.created_at).toISOString(),
    resolved_at: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
  }));

  return {
    items,
    total: parseInt(totalRows[0]?.cnt ?? "0", 10),
  };
}

export interface ReportDetail extends ReportListItem {
  metadata: Record<string, unknown>;
}

export async function getReportById(
  id: string,
): Promise<ReportDetail | undefined> {
  type RawRow = Record<string, unknown> & {
    id: string;
    reporter_id: string;
    reporter_username: string;
    target_type: string;
    target_account_id: string | null;
    target_pet_id: string | null;
    target_message_id: string | null;
    target_username: string | null;
    reason: string;
    status: string;
    metadata: unknown;
    created_at: Date;
    resolved_at: Date | null;
  };

  const rows = await db.execute<RawRow>(sql`
    SELECT
      r.id,
      r.reporter_id,
      reporter.username AS reporter_username,
      r.target_type::text,
      r.target_account_id,
      r.target_pet_id,
      r.target_message_id,
      target_acc.username AS target_username,
      r.reason::text,
      r.status::text,
      r.metadata,
      r.created_at,
      r.resolved_at
    FROM reports r
    JOIN accounts reporter ON reporter.id = r.reporter_id
    LEFT JOIN accounts target_acc ON target_acc.id = r.target_account_id
    WHERE r.id = ${id}
    LIMIT 1
  `);

  const r = rows[0];
  if (!r) return undefined;

  return {
    id: r.id,
    reporter_id: r.reporter_id,
    reporter_username: r.reporter_username,
    target_type: reportTargetTypeSchema.parse(r.target_type),
    target_account_id: r.target_account_id,
    target_pet_id: r.target_pet_id,
    target_message_id: r.target_message_id,
    target_username: r.target_username,
    reason: reportReasonSchema.parse(r.reason),
    status: reportStatusSchema.parse(r.status),
    metadata: reportMetadataSchema.parse(r.metadata),
    created_at: new Date(r.created_at).toISOString(),
    resolved_at: r.resolved_at ? new Date(r.resolved_at).toISOString() : null,
  };
}

export async function updateReportStatus(
  id: string,
  status: "reviewed" | "resolved" | "dismissed",
): Promise<void> {
  const resolvedAt = status === "resolved" ? new Date() : null;

  await db
    .update(reports)
    .set({
      status,
      resolvedAt,
    })
    .where(eq(reports.id, id));
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getStatsOverview() {
  type CountRow = Record<string, unknown> & {
    total_accounts: string;
    verified_accounts: string;
    unverified_accounts: string;
    banned_accounts: string;
    total_pets: string;
    total_matches: string;
    total_messages: string;
    total_reports: string;
    resolved_reports: string;
    pending_reports: string;
    total_swipes: string;
    dau: string;
    match_rate: string;
    dogs: string;
    cats: string;
    yesterday_accounts: string;
    yesterday_pets: string;
    yesterday_matches: string;
    yesterday_messages: string;
    today_accounts: string;
    today_pets: string;
    active_7_days: string;
  };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const [rows, onlineUsers] = await Promise.all([
    db.execute<CountRow>(sql`
      SELECT
        (SELECT COUNT(*) FROM accounts WHERE deleted_at IS NULL)::text AS total_accounts,
        (SELECT COUNT(*) FROM accounts WHERE status = 'verified' AND deleted_at IS NULL)::text AS verified_accounts,
        (SELECT COUNT(*) FROM accounts WHERE status = 'unverified' AND deleted_at IS NULL)::text AS unverified_accounts,
        (SELECT COUNT(*) FROM accounts WHERE status = 'banned' AND deleted_at IS NULL)::text AS banned_accounts,
        (SELECT COUNT(*) FROM pets WHERE deleted_at IS NULL)::text AS total_pets,
        (SELECT COUNT(*) FROM matches)::text AS total_matches,
        (SELECT COUNT(*) FROM messages)::text AS total_messages,
        (SELECT COUNT(*) FROM reports)::text AS total_reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'resolved')::text AS resolved_reports,
        (SELECT COUNT(*) FROM reports WHERE status = 'pending')::text AS pending_reports,
        (SELECT COUNT(*) FROM swipes)::text AS total_swipes,
        (
          SELECT COUNT(DISTINCT user_id)::text
          FROM (
            SELECT user_one_id as user_id FROM matches WHERE created_at::date = ${today}
            UNION ALL
            SELECT user_two_id as user_id FROM matches WHERE created_at::date = ${today}
            UNION ALL
            SELECT sender_id as user_id FROM messages WHERE created_at::date = ${today}
            UNION ALL
            SELECT swiper_user_id as user_id FROM swipes WHERE created_at::date = ${today}
          ) AS actions
        ) AS dau,
        (
          SELECT '0'::text
        ) AS match_rate,
        (SELECT COUNT(*) FROM pets p JOIN breeds b ON b.id = p.breed_id JOIN species s ON s.id = b.species_id WHERE s.name_en = 'Dog' AND p.deleted_at IS NULL)::text AS dogs,
        (SELECT COUNT(*) FROM pets p JOIN breeds b ON b.id = p.breed_id JOIN species s ON s.id = b.species_id WHERE s.name_en = 'Cat' AND p.deleted_at IS NULL)::text AS cats,
        (SELECT COUNT(*) FROM accounts WHERE created_at::date = ${yesterday} AND deleted_at IS NULL)::text AS yesterday_accounts,
        (SELECT COUNT(*) FROM pets WHERE created_at::date = ${yesterday} AND deleted_at IS NULL)::text AS yesterday_pets,
        (SELECT COUNT(*) FROM matches WHERE created_at::date = ${yesterday})::text AS yesterday_matches,
        (SELECT COUNT(*) FROM messages WHERE created_at::date = ${yesterday})::text AS yesterday_messages,
        (SELECT COUNT(*) FROM accounts WHERE created_at::date = ${today} AND deleted_at IS NULL)::text AS today_accounts,
        (SELECT COUNT(*) FROM pets WHERE created_at::date = ${today} AND deleted_at IS NULL)::text AS today_pets,
        (
          SELECT COUNT(DISTINCT user_id)::text
          FROM (
            SELECT user_one_id as user_id FROM matches WHERE created_at::date >= NOW() - INTERVAL '7 days'
            UNION ALL
            SELECT user_two_id as user_id FROM matches WHERE created_at::date >= NOW() - INTERVAL '7 days'
            UNION ALL
            SELECT sender_id as user_id FROM messages WHERE created_at::date >= NOW() - INTERVAL '7 days'
            UNION ALL
            SELECT swiper_user_id as user_id FROM swipes WHERE created_at::date >= NOW() - INTERVAL '7 days'
          ) AS actions_7d
        ) AS active_7_days
    `),
    countOnlineUsers(),
  ]);

  const r = rows[0];
  if (!r) {
    return {
      total_accounts: 0,
      verified_accounts: 0,
      unverified_accounts: 0,
      banned_accounts: 0,
      total_pets: 0,
      total_matches: 0,
      total_messages: 0,
      total_reports: 0,
      resolved_reports: 0,
      pending_reports: 0,
      total_swipes: 0,
      online_users: onlineUsers,
      dau: 0,
      match_rate: 0,
      dogs: 0,
      cats: 0,
      yesterday_accounts: 0,
      yesterday_pets: 0,
      yesterday_matches: 0,
      yesterday_messages: 0,
      today_accounts: 0,
      today_pets: 0,
      active_7_days: 0,
    };
  }

  const yesterdayAccounts = parseInt(r.yesterday_accounts ?? "0", 10);
  const yesterdayPets = parseInt(r.yesterday_pets ?? "0", 10);
  const yesterdayMatches = parseInt(r.yesterday_matches ?? "0", 10);
  const yesterdayMessages = parseInt(r.yesterday_messages ?? "0", 10);

  const totalAccounts = parseInt(r.total_accounts, 10);
  const totalPets = parseInt(r.total_pets, 10);
  const totalMessages = parseInt(r.total_messages, 10);

  return {
    total_accounts: totalAccounts,
    verified_accounts: parseInt(r.verified_accounts, 10),
    unverified_accounts: parseInt(r.unverified_accounts, 10),
    banned_accounts: parseInt(r.banned_accounts, 10),
    total_pets: totalPets,
    total_matches: parseInt(r.total_matches, 10),
    total_messages: totalMessages,
    total_reports: parseInt(r.total_reports, 10),
    resolved_reports: parseInt(r.resolved_reports, 10),
    pending_reports: parseInt(r.pending_reports, 10),
    total_swipes: parseInt(r.total_swipes, 10),
    online_users: onlineUsers,
    dau: parseInt(r.dau ?? "0", 10),
    match_rate: parseFloat(r.match_rate ?? "0"),
    dogs: parseInt(r.dogs ?? "0", 10),
    cats: parseInt(r.cats ?? "0", 10),
    yesterday_accounts: yesterdayAccounts,
    yesterday_pets: yesterdayPets,
    yesterday_matches: yesterdayMatches,
    yesterday_messages: yesterdayMessages,
    today_accounts: parseInt(r.today_accounts ?? "0", 10),
    today_pets: parseInt(r.today_pets ?? "0", 10),
    active_7_days: parseInt(r.active_7_days ?? "0", 10),
  };
}

export async function getStatsGrowth() {
  type DayRow = Record<string, unknown> & {
    date: string;
    accounts: string;
    pets: string;
    matches: string;
  };

  const rows = await db.execute<DayRow>(sql`
    WITH days AS (
      SELECT generate_series(
        NOW() - INTERVAL '29 days',
        NOW(),
        INTERVAL '1 day'
      )::date AS day
    )
    SELECT
      TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
      COUNT(DISTINCT a.id)::text AS accounts,
      COUNT(DISTINCT p.id)::text AS pets,
      COUNT(DISTINCT m.id)::text AS matches
    FROM days d
    LEFT JOIN accounts a ON a.created_at::date = d.day AND a.deleted_at IS NULL
    LEFT JOIN pets p ON p.created_at::date = d.day AND p.deleted_at IS NULL
    LEFT JOIN matches m ON m.created_at::date = d.day
    GROUP BY d.day
    ORDER BY d.day ASC
  `);

  return {
    accounts: rows.map((r) => ({
      date: r.date,
      value: parseInt(r.accounts, 10),
    })),
    pets: rows.map((r) => ({ date: r.date, value: parseInt(r.pets, 10) })),
    matches: rows.map((r) => ({
      date: r.date,
      value: parseInt(r.matches, 10),
    })),
  };
}

export async function getStatsActivity() {
  type DayRow = Record<string, unknown> & {
    date: string;
    messages: string;
    swipes: string;
  };

  const rows = await db.execute<DayRow>(sql`
    WITH days AS (
      SELECT generate_series(
        NOW() - INTERVAL '29 days',
        NOW(),
        INTERVAL '1 day'
      )::date AS day
    )
    SELECT
      TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
      COUNT(DISTINCT msg.id)::text AS messages,
      COUNT(DISTINCT sw.id)::text AS swipes
    FROM days d
    LEFT JOIN messages msg ON msg.created_at::date = d.day
    LEFT JOIN swipes sw ON sw.created_at::date = d.day
    GROUP BY d.day
    ORDER BY d.day ASC
  `);

  return {
    messages: rows.map((r) => ({
      date: r.date,
      value: parseInt(r.messages, 10),
    })),
    swipes: rows.map((r) => ({ date: r.date, value: parseInt(r.swipes, 10) })),
  };
}

export async function getStatsReports() {
  type ReasonRow = Record<string, unknown> & { reason: string; cnt: string };
  type StatusRow = Record<string, unknown> & { status: string; cnt: string };

  const [byReason, byStatus] = await Promise.all([
    db.execute<ReasonRow>(sql`
      SELECT reason::text, COUNT(*)::text AS cnt
      FROM reports
      GROUP BY reason
      ORDER BY cnt DESC
    `),
    db.execute<StatusRow>(sql`
      SELECT status::text, COUNT(*)::text AS cnt
      FROM reports
      GROUP BY status
      ORDER BY cnt DESC
    `),
  ]);

  return {
    by_reason: byReason.map((r) => ({
      reason: r.reason,
      count: parseInt(r.cnt, 10),
    })),
    by_status: byStatus.map((r) => ({
      status: r.status,
      count: parseInt(r.cnt, 10),
    })),
  };
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export async function getMetrics() {
  const today = new Date().toISOString().slice(0, 10);
  const pattern = `metrics:req:${today}:*:count`;

  // Scan today's Redis keys
  let cursor = "0";
  const countKeys: string[] = [];

  do {
    const result: unknown = await redis.send("SCAN", [
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      "200",
    ]);
    if (!Array.isArray(result)) break;
    const [nextCursor, keys] = z
      .tuple([z.string(), z.array(z.string())])
      .parse(result);
    cursor = nextCursor;
    countKeys.push(...keys);
  } while (cursor !== "0");

  let totalRequests = 0;
  let totalErrors = 0;
  let totalMs = 0;

  type EndpointAgg = {
    path: string;
    method: string;
    request_count: number;
    error_count: number;
    total_ms: number;
  };

  const endpointMap = new Map<string, EndpointAgg>();

  for (const countKey of countKeys) {
    const withoutPrefix = countKey.replace(`metrics:req:${today}:`, "");
    const lastColon = withoutPrefix.lastIndexOf(":");
    const pathAndMethod = withoutPrefix.slice(0, lastColon);
    const methodStart = pathAndMethod.lastIndexOf(":");
    const method = pathAndMethod.slice(methodStart + 1);
    const path = pathAndMethod.slice(0, methodStart);
    const base = `metrics:req:${today}:${path}:${method}`;

    const [rawCount, rawErrors, rawMs] = await Promise.all([
      redis.get(`${base}:count`),
      redis.get(`${base}:errors`),
      redis.get(`${base}:ms_sum`),
    ]);

    const reqCount = parseInt(rawCount ?? "0", 10);
    const errCount = parseInt(rawErrors ?? "0", 10);
    const msSum = parseInt(rawMs ?? "0", 10);

    totalRequests += reqCount;
    totalErrors += errCount;
    totalMs += msSum;

    const key = `${path}:${method}`;
    const existing = endpointMap.get(key);
    if (existing) {
      existing.request_count += reqCount;
      existing.error_count += errCount;
      existing.total_ms += msSum;
    } else {
      endpointMap.set(key, {
        path,
        method,
        request_count: reqCount,
        error_count: errCount,
        total_ms: msSum,
      });
    }
  }

  // Historical data from DB (last 30 days)
  const history = await db
    .select({
      date: metricsSnapshots.date,
      requestCount: sql<number>`SUM(${metricsSnapshots.requestCount})`,
      errorCount: sql<number>`SUM(${metricsSnapshots.errorCount})`,
      totalMs: sql<number>`SUM(${metricsSnapshots.totalMs})`,
    })
    .from(metricsSnapshots)
    .where(
      sql`${metricsSnapshots.date} >= TO_CHAR(NOW() - INTERVAL '30 days', 'YYYY-MM-DD')`,
    )
    .groupBy(metricsSnapshots.date)
    .orderBy(metricsSnapshots.date);

  const endpoints = Array.from(endpointMap.values())
    .sort((a, b) => b.request_count - a.request_count)
    .slice(0, 20)
    .map((e) => ({
      path: e.path,
      method: e.method,
      request_count: e.request_count,
      error_count: e.error_count,
      avg_ms:
        e.request_count > 0 ? Math.round(e.total_ms / e.request_count) : 0,
      error_rate:
        e.request_count > 0
          ? Math.round((e.error_count / e.request_count) * 100) / 100
          : 0,
    }));

  return {
    today: {
      total_requests: totalRequests,
      total_errors: totalErrors,
      avg_ms: totalRequests > 0 ? Math.round(totalMs / totalRequests) : 0,
      error_rate:
        totalRequests > 0
          ? Math.round((totalErrors / totalRequests) * 100) / 100
          : 0,
    },
    history: history.map((h) => ({
      date: h.date,
      request_count: Number(h.requestCount),
      error_count: Number(h.errorCount),
      avg_ms:
        Number(h.requestCount) > 0
          ? Math.round(Number(h.totalMs) / Number(h.requestCount))
          : 0,
    })),
    endpoints,
  };
}

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export interface AccountListItem {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "unverified" | "verified" | "banned";
  is_online: boolean;
  report_count: number;
  created_at: string;
}

export async function listAccounts(opts: {
  page: number;
  perPage: number;
  search?: string;
  status?: "unverified" | "verified" | "banned";
}): Promise<{ items: AccountListItem[]; total: number }> {
  const offset = (opts.page - 1) * opts.perPage;

  const whereConditions = [];
  if (opts.status) {
    whereConditions.push(eq(accounts.status, opts.status));
  }
  if (opts.search) {
    whereConditions.push(
      or(
        ilike(accounts.username, `%${opts.search}%`),
        ilike(accounts.email, `%${opts.search}%`),
        ilike(accounts.firstName, `%${opts.search}%`),
        ilike(accounts.lastName, `%${opts.search}%`),
      ),
    );
  }
  whereConditions.push(sql`${accounts.deletedAt} IS NULL`);

  const where =
    whereConditions.length > 0 ? and(...whereConditions) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: accounts.id,
        username: accounts.username,
        email: accounts.email,
        firstName: accounts.firstName,
        lastName: accounts.lastName,
        status: accounts.status,
        isOnline: accounts.isOnline,
        createdAt: accounts.createdAt,
        reportCount: sql<number>`(
          SELECT COUNT(*) FROM reports WHERE target_account_id = ${accounts.id}
        )`,
      })
      .from(accounts)
      .where(where)
      .orderBy(desc(accounts.createdAt))
      .limit(opts.perPage)
      .offset(offset),
    db.select({ cnt: count() }).from(accounts).where(where),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      first_name: r.firstName,
      last_name: r.lastName,
      status: r.status,
      is_online: r.isOnline,
      report_count: Number(r.reportCount),
      created_at: r.createdAt
        ? new Date(r.createdAt).toISOString()
        : new Date().toISOString(),
    })),
    total: totalRows[0]?.cnt ?? 0,
  };
}

export interface AccountDetail {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio: string | null;
  status: "unverified" | "verified" | "banned";
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
  pets: Array<{
    id: string;
    name: string;
    species_id: number;
    created_at: string;
  }>;
  reports_against: Array<{
    id: string;
    reason: string;
    status: string;
    created_at: string;
  }>;
}

export async function getAccountById(
  id: string,
): Promise<AccountDetail | undefined> {
  const accRows = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), sql`${accounts.deletedAt} IS NULL`))
    .limit(1);

  const acc = accRows[0];
  if (!acc) return undefined;

  const [petRows, reportRows] = await Promise.all([
    db
      .select({
        id: pets.id,
        name: pets.name,
        breedId: pets.breedId,
        createdAt: pets.createdAt,
      })
      .from(pets)
      .where(and(eq(pets.accountId, id), sql`${pets.deletedAt} IS NULL`)),
    db
      .select({
        id: reports.id,
        reason: reports.reason,
        status: reports.status,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(eq(reports.targetAccountId, id))
      .orderBy(desc(reports.createdAt))
      .limit(20),
  ]);

  return {
    id: acc.id,
    username: acc.username,
    email: acc.email,
    first_name: acc.firstName,
    last_name: acc.lastName,
    bio: acc.bio ?? null,
    status: acc.status,
    is_online: acc.isOnline,
    last_seen_at: acc.lastSeenAt
      ? new Date(acc.lastSeenAt).toISOString()
      : null,
    created_at: acc.createdAt
      ? new Date(acc.createdAt).toISOString()
      : new Date().toISOString(),
    pets: petRows.map((p) => ({
      id: p.id,
      name: p.name,
      species_id: Number(p.breedId),
      created_at: p.createdAt
        ? new Date(p.createdAt).toISOString()
        : new Date().toISOString(),
    })),
    reports_against: reportRows.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      created_at: r.createdAt
        ? new Date(r.createdAt).toISOString()
        : new Date().toISOString(),
    })),
  };
}

export async function updateAccountStatus(
  id: string,
  status: "verified" | "banned" | "unverified",
): Promise<void> {
  await db.update(accounts).set({ status }).where(eq(accounts.id, id));
}
