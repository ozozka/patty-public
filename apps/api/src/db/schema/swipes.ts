import { pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { accounts } from "./accounts";
import { pets } from "./pets";

export const swipeActionEnum = pgEnum("swipe_action", ["like", "dislike"]);

export const swipes = pgTable("swipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  swiperUserId: uuid("swiper_user_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "cascade" }),
  activePetId: uuid("active_pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  targetPetId: uuid("target_pet_id")
    .notNull()
    .references(() => pets.id, { onDelete: "cascade" }),
  action: swipeActionEnum("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
