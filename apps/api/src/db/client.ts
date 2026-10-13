import { env } from "@patty/api/env";
import { logger } from "@patty/api/lib/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const _queryClient = postgres(env.DATABASE_URL, {
  max: env.DB_POOL_SIZE,
  // Silence Postgres notices (like "schema already exists") during silent mode
  onnotice:
    env.LOG_LEVEL === "silent"
      ? () => {}
      : (notice) => logger.info(notice.message),
});

/** Drizzle database instance. Import this from feature repositories. */
export const db = drizzle(_queryClient, { schema });

/** Raw postgres client for transactions - use in tests only */
export const queryClient = _queryClient;

export type Database = typeof db;
