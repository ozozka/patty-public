import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { accounts } from "./accounts";

export const phoneVerificationCodes = pgTable("phone_verification_codes", {
  accountId: uuid("account_id")
    .primaryKey()
    .references(() => accounts.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verifyAttempts: integer("verify_attempts").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailVerificationCodes = pgTable("email_verification_codes", {
  accountId: uuid("account_id")
    .primaryKey()
    .references(() => accounts.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(1),
  verifyAttempts: integer("verify_attempts").notNull().default(0),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dailyCount: integer("daily_count").notNull().default(1),
  lastDailyResetAt: timestamp("last_daily_reset_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastIp: text("last_ip"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  accountId: uuid("account_id")
    .primaryKey()
    .references(() => accounts.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").notNull().default(1),
  verifyAttempts: integer("verify_attempts").notNull().default(0),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dailyCount: integer("daily_count").notNull().default(1),
  lastDailyResetAt: timestamp("last_daily_reset_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastIp: text("last_ip"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
