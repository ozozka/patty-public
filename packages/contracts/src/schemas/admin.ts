import { z } from 'zod';

export const adminRoleSchema = z.enum(['super_admin', 'moderator']);

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminLoginResponseSchema = z.object({
  token: z.string(),
});

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const adminReportListItemSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string().uuid(),
  reporter_username: z.string(),
  target_type: z.enum(['account', 'pet', 'message']),
  target_account_id: z.string().uuid().nullable(),
  target_pet_id: z.string().uuid().nullable(),
  target_message_id: z.string().uuid().nullable(),
  target_username: z.string().nullable(),
  reason: z.enum(['spam', 'inappropriate', 'harassment', 'fraud', 'other']),
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']),
  created_at: z.string(),
  resolved_at: z.string().nullable(),
});

export const adminReportListSchema = z.object({
  items: z.array(adminReportListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
});

export const adminReportDetailSchema = adminReportListItemSchema.extend({
  metadata: z.record(z.string(), z.unknown()),
});

export const adminReportUpdateSchema = z.object({
  status: z.enum(['reviewed', 'resolved', 'dismissed']),
});

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export const adminStatsOverviewSchema = z.object({
  total_accounts: z.number(),
  verified_accounts: z.number(),
  unverified_accounts: z.number(),
  banned_accounts: z.number(),
  total_pets: z.number(),
  total_matches: z.number(),
  total_messages: z.number(),
  total_reports: z.number(),
  resolved_reports: z.number(),
  pending_reports: z.number(),
  total_swipes: z.number(),
  online_users: z.number(),
  dau: z.number(),
  match_rate: z.number(),
  dogs: z.number(),
  cats: z.number(),
  yesterday_accounts: z.number(),
  yesterday_pets: z.number(),
  yesterday_matches: z.number(),
  yesterday_messages: z.number(),
  today_accounts: z.number(),
  today_pets: z.number(),
  active_7_days: z.number(),
});

export const adminStatsDaySchema = z.object({
  date: z.string(),
  value: z.number(),
});

export const adminStatsGrowthSchema = z.object({
  accounts: z.array(adminStatsDaySchema),
  pets: z.array(adminStatsDaySchema),
  matches: z.array(adminStatsDaySchema),
});

export const adminStatsActivitySchema = z.object({
  messages: z.array(adminStatsDaySchema),
  swipes: z.array(adminStatsDaySchema),
});

export const adminStatsReportsSchema = z.object({
  by_reason: z.array(
    z.object({
      reason: z.string(),
      count: z.number(),
    }),
  ),
  by_status: z.array(
    z.object({
      status: z.string(),
      count: z.number(),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export const adminMetricsEndpointSchema = z.object({
  path: z.string(),
  method: z.string(),
  request_count: z.number(),
  error_count: z.number(),
  avg_ms: z.number(),
  error_rate: z.number(),
});

export const adminMetricsDaySchema = z.object({
  date: z.string(),
  request_count: z.number(),
  error_count: z.number(),
  avg_ms: z.number(),
});

export const adminMetricsSchema = z.object({
  today: z.object({
    total_requests: z.number(),
    total_errors: z.number(),
    avg_ms: z.number(),
    error_rate: z.number(),
  }),
  history: z.array(adminMetricsDaySchema),
  endpoints: z.array(adminMetricsEndpointSchema),
});

// ---------------------------------------------------------------------------
// Accounts (user management)
// ---------------------------------------------------------------------------

export const adminAccountListItemSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  status: z.enum(['unverified', 'verified', 'banned']),
  is_online: z.boolean(),
  report_count: z.number(),
  created_at: z.string(),
});

export const adminAccountListSchema = z.object({
  items: z.array(adminAccountListItemSchema),
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
});

export const adminAccountDetailSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  bio: z.string().nullable(),
  status: z.enum(['unverified', 'verified', 'banned']),
  is_online: z.boolean(),
  last_seen_at: z.string().nullable(),
  created_at: z.string(),
  pets: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      species_id: z.number(),
      created_at: z.string(),
    }),
  ),
  reports_against: z.array(
    z.object({
      id: z.string().uuid(),
      reason: z.string(),
      status: z.string(),
      created_at: z.string(),
    }),
  ),
});

export const adminAccountStatusUpdateSchema = z.object({
  status: z.enum(['verified', 'banned', 'unverified']),
});

// ---------------------------------------------------------------------------
// Pagination query params
// ---------------------------------------------------------------------------

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
});

export const adminReportFilterSchema = adminPaginationSchema.extend({
  status: z
    .enum(['pending', 'reviewed', 'resolved', 'dismissed'])
    .optional(),
});

export const adminAccountFilterSchema = adminPaginationSchema.extend({
  search: z.string().optional(),
  status: z.enum(['unverified', 'verified', 'banned']).optional(),
});
