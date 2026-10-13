import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "location",
]);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userOneId: uuid("user_one_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    userTwoId: uuid("user_two_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    lastMessageId: uuid("last_message_id"),
    lastMessageSenderId: uuid("last_message_sender_id"),
    lastMessageType: messageTypeEnum("last_message_type"),
    lastMessagePreview: text("last_message_preview"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    metadata: jsonb("metadata").notNull().default({}),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.userOneId, t.userTwoId)],
);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  replyToId: uuid("reply_to_id"),
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").notNull().default("text"),
  isRead: boolean("is_read").notNull().default(false),
  latitude: text("latitude"),
  longitude: text("longitude"),
  locationName: text("location_name"),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
