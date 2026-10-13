import { integer, pgTable, serial, unique, varchar } from "drizzle-orm/pg-core";

export const species = pgTable("species", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 255 }).notNull().unique(),
  nameTr: varchar("name_tr", { length: 255 }).notNull(),
});

export const breeds = pgTable(
  "breeds",
  {
    id: serial("id").primaryKey(),
    speciesId: integer("species_id")
      .notNull()
      .references(() => species.id, { onDelete: "cascade" }),
    nameEn: varchar("name_en", { length: 255 }).notNull(),
    nameTr: varchar("name_tr", { length: 255 }).notNull(),
  },
  (t) => [unique().on(t.speciesId, t.nameEn)],
);
