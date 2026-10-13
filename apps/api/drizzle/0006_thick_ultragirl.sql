CREATE TABLE "login_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_until" timestamp with time zone
);

CREATE INDEX idx_login_rate_limits_window ON login_rate_limits (window_start);
