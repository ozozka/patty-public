ALTER TABLE "accounts" ADD COLUMN "pending_email" varchar(256);--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_pending_email_unique" UNIQUE("pending_email");