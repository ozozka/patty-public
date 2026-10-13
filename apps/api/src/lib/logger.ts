import { env } from "@patty/api/env";
import pino from "pino";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.LOG_LEVEL === "debug" || env.LOG_LEVEL === "trace"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
