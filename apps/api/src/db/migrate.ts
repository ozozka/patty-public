import { migrate } from "drizzle-orm/postgres-js/migrator";

import { db } from "./client";

/** Runs all pending Drizzle migrations against the connected database. */
export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: "./drizzle" });
}
