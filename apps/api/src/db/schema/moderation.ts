import {
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { messages } from "./matches";
import { pets } from "./pets";

export const reportReasonEnum = pgEnum("report_reason", [
  "spam",
  "inappropriate",
  "harassment",
  "fraud",
  "other",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "resolved",
  "dismissed",
]);
export const reportTargetTypeEnum = pgEnum("report_target_type", [
  "account",
  "pet",
  "message",
]);

export const userBlocks = pgTable(
  "user_blocks",
  {
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })],
);

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  targetType: reportTargetTypeEnum("target_type").notNull(),
  targetAccountId: uuid("target_account_id").references(() => accounts.id, {
    onDelete: "cascade",
  }),
  targetPetId: uuid("target_pet_id").references(() => pets.id, {
    onDelete: "cascade",
  }),
  targetMessageId: uuid("target_message_id").references(() => messages.id, {
    onDelete: "cascade",
  }),
  reason: reportReasonEnum("reason").notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
