ALTER TABLE "accounts" ADD COLUMN "token_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verification_codes" ADD COLUMN "verify_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_codes" ADD COLUMN "verify_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "phone_verification_codes" ADD COLUMN "verify_attempts" integer DEFAULT 0 NOT NULL;