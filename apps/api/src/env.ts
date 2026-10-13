import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(32),
  ADMIN_JWT_SECRET: z.string().min(32),
  INITIAL_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  INITIAL_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().default("re_placeholder"),
  RESEND_SENDER_EMAIL: z.string().email().default("verification@patty.app"),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DB_POOL_SIZE: z.coerce.number().int().positive().min(1).max(100).default(10),
  EMAIL_IP_THROTTLE_LIMIT: z.coerce.number().int().positive().default(3),
  EMAIL_DAILY_CAP: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_GLOBAL_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60_000),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  // Internal E2E routes reject requests when no secret is configured.
  MAESTRO_SECRET: z.string().min(1).optional(),
  E2E_TEST_EMAIL: z.string().email().default("test-maestro@patty.app"),
  E2E_BYPASS_CODE: z.string().default("123456"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger depends on env, so use stderr directly for startup validation failures.
  process.stderr.write(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}\n`,
  );
  process.exit(1);
}

export const env = parsed.data;
