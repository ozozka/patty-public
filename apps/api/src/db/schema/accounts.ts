import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { locations } from "./locations";

export const accountStatusEnum = pgEnum("account_status", [
  "unverified",
  "verified",
  "banned",
]);
export const locationPrecisionEnum = pgEnum("location_precision", [
  "exact",
  "city",
]);

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 256 }).notNull().unique(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  firstName: varchar("first_name", { length: 128 }).notNull(),
  lastName: varchar("last_name", { length: 128 }).notNull(),
  password: varchar("password", { length: 256 }).notNull(),
  bio: text("bio"),
  homeLocationId: integer("home_location_id").references(() => locations.id),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  // location GEOGRAPHY(Point, 4326) is managed via raw SQL migration
  locationPrecision: locationPrecisionEnum("location_precision")
    .notNull()
    .default("exact"),
  language: varchar("language", { length: 5 }).notNull().default("tr"),
  theme: varchar("theme", { length: 10 }).notNull().default("system"),
  profilePictureUrl: varchar("profile_picture_url", { length: 1024 }),
  pushToken: text("push_token"),
  status: accountStatusEnum("status").notNull().default("unverified"),
  pendingEmail: varchar("pending_email", { length: 256 }).unique(),
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  sharePhoneWithMatches: boolean("share_phone_with_matches")
    .notNull()
    .default(false),
  tokenVersion: integer("token_version").notNull().default(0),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
  metadata: jsonb("metadata").notNull().default({}),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
