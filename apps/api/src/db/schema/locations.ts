import { integer, pgEnum, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const locationLevelEnum = pgEnum("location_level", [
  "province",
  "district",
]);

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  nameTr: varchar("name_tr", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  level: locationLevelEnum("level").notNull(),
  // geom GEOMETRY and center GEOGRAPHY are managed via raw SQL migration
});
