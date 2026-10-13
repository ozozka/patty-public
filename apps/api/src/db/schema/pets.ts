import {
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { breeds } from "./species";

export const petGenderEnum = pgEnum("pet_gender", ["male", "female"]);

export const pets = pgTable("pets", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  breedId: integer("breed_id")
    .notNull()
    .references(() => breeds.id),
  birthDate: date("birth_date"),
  bio: text("bio"),
  energyLevel: smallint("energy_level"),
  gender: petGenderEnum("gender"),
  // matching_preferences pet_gender[] is managed via raw SQL migration
  metadata: jsonb("metadata").notNull().default({}),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const petPhotos = pgTable("pet_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  petId: uuid("pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  imageUrl: varchar("image_url", { length: 1024 }).notNull(),
  displayOrder: smallint("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
