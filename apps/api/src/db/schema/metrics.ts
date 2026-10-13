import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Daily aggregate snapshots flushed from Redis each night.
 * Live intraday data lives in Redis keys (see lib/metrics.ts).
 */
export const metricsSnapshots = pgTable(
  "metrics_snapshots",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    date: text("date").notNull(), // YYYY-MM-DD
    path: text("path").notNull(), // normalized (UUIDs → :id)
    method: text("method").notNull(),
    requestCount: integer("request_count").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    totalMs: integer("total_ms").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("metrics_snapshots_date_path_method_idx").on(
      t.date,
      t.path,
      t.method,
    ),
  ],
);
