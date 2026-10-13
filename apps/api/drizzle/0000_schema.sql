-- Complete initial schema: types, tables, PostGIS, indexes, triggers.
-- Merges what were previously migrations 0000-0001 and 0003-0004.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TYPE "public"."account_status" AS ENUM('unverified', 'verified', 'banned');
CREATE TYPE "public"."location_precision" AS ENUM('exact', 'city');
CREATE TYPE "public"."location_level" AS ENUM('province', 'district');
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'location');
CREATE TYPE "public"."report_reason" AS ENUM('spam', 'inappropriate', 'harassment', 'fraud', 'other');
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE "public"."report_target_type" AS ENUM('account', 'pet', 'message');
CREATE TYPE "public"."pet_gender" AS ENUM('male', 'female');
CREATE TYPE "public"."swipe_action" AS ENUM('like', 'dislike');
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"first_name" varchar(128) NOT NULL,
	"last_name" varchar(128) NOT NULL,
	"password" varchar(256) NOT NULL,
	"bio" text,
	"home_location_id" integer,
	"latitude" double precision,
	"longitude" double precision,
	"location_precision" "location_precision" DEFAULT 'exact' NOT NULL,
	"language" varchar(5) DEFAULT 'tr' NOT NULL,
	"theme" varchar(10) DEFAULT 'system' NOT NULL,
	"profile_picture_url" varchar(1024),
	"push_token" text,
	"status" "account_status" DEFAULT 'unverified' NOT NULL,
	"phone_number" text,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"share_phone_with_matches" boolean DEFAULT false NOT NULL,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "accounts_username_unique" UNIQUE("username"),
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name_tr" varchar(255) NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"level" "location_level" NOT NULL,
	CONSTRAINT "locations_name_en_level_unique" UNIQUE ("name_en", "level")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_one_id" uuid NOT NULL,
	"user_two_id" uuid NOT NULL,
	"last_message_id" uuid,
	"last_message_sender_id" uuid,
	"last_message_type" "message_type",
	"last_message_preview" text,
	"last_message_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "matches_user_one_id_user_two_id_unique" UNIQUE("user_one_id","user_two_id"),
	CONSTRAINT "check_not_self_match" CHECK (user_one_id != user_two_id)
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"reply_to_id" uuid,
	"content" text NOT NULL,
	"message_type" "message_type" DEFAULT 'text' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"latitude" text,
	"longitude" text,
	"location_name" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"target_type" "report_target_type" NOT NULL,
	"target_account_id" uuid,
	"target_pet_id" uuid,
	"target_message_id" uuid,
	"reason" "report_reason" NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "pet_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pet_id" uuid NOT NULL,
	"image_url" varchar(1024) NOT NULL,
	"display_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
-- matching_preferences: array enum, Drizzle has no native support (managed via raw SQL).
-- Default '{male,female}' means show the pet to owners of both genders.
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"breed_id" integer NOT NULL,
	"birth_date" date,
	"bio" text,
	"energy_level" smallint,
	"gender" "pet_gender",
	"matching_preferences" pet_gender[] DEFAULT '{male,female}'::pet_gender[],
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "breeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"species_id" integer NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_tr" varchar(255) NOT NULL,
	CONSTRAINT "breeds_species_id_name_en_unique" UNIQUE("species_id","name_en")
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"name_tr" varchar(255) NOT NULL,
	CONSTRAINT "species_name_en_unique" UNIQUE("name_en")
);
--> statement-breakpoint
CREATE TABLE "swipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"swiper_user_id" uuid NOT NULL,
	"active_pet_id" uuid NOT NULL,
	"target_pet_id" uuid NOT NULL,
	"action" "swipe_action" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_verification_codes" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"daily_count" integer DEFAULT 1 NOT NULL,
	"last_daily_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_codes" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"last_sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"daily_count" integer DEFAULT 1 NOT NULL,
	"last_daily_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phone_verification_codes" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_home_location_id_locations_id_fk" FOREIGN KEY ("home_location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_one_id_accounts_id_fk" FOREIGN KEY ("user_one_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_user_two_id_accounts_id_fk" FOREIGN KEY ("user_two_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_accounts_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_accounts_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_account_id_accounts_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_pet_id_pets_id_fk" FOREIGN KEY ("target_pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_target_message_id_messages_id_fk" FOREIGN KEY ("target_message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_accounts_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_accounts_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pet_photos" ADD CONSTRAINT "pet_photos_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_breed_id_breeds_id_fk" FOREIGN KEY ("breed_id") REFERENCES "public"."breeds"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "breeds" ADD CONSTRAINT "breeds_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiper_user_id_accounts_id_fk" FOREIGN KEY ("swiper_user_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_active_pet_id_pets_id_fk" FOREIGN KEY ("active_pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_target_pet_id_pets_id_fk" FOREIGN KEY ("target_pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "password_reset_codes" ADD CONSTRAINT "password_reset_codes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "phone_verification_codes" ADD CONSTRAINT "phone_verification_codes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);
--> statement-breakpoint
ALTER TABLE locations ADD COLUMN IF NOT EXISTS geom GEOMETRY(MultiPolygon, 4326);
--> statement-breakpoint
ALTER TABLE locations ADD COLUMN IF NOT EXISTS center GEOMETRY(Point, 4326);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations (parent_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_locations_center ON locations USING GIST (center);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_breeds_species_id ON breeds (species_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_breeds_name_en ON breeds (name_en);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_breeds_name_tr ON breeds (name_tr);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_accounts_location ON accounts USING GIST (location);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_accounts_home_location_id ON accounts (home_location_id);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_phone_number ON accounts (phone_number) WHERE phone_number IS NOT NULL AND deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_accounts_username_trgm ON accounts USING GIN (username gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_accounts_deleted_at ON accounts (deleted_at) WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pets_account_id ON pets (account_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pets_breed_id ON pets (breed_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pets_name_trgm ON pets USING GIN (name gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pets_deleted_at ON pets (deleted_at) WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_pet_photos_pet_id ON pet_photos (pet_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_swipes_swiper_active_target ON swipes (swiper_user_id, active_pet_id, target_pet_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_swipes_active_pet_id ON swipes (active_pet_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_matches_user_one ON matches (user_one_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_matches_user_two ON matches (user_two_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_matches_deleted_at ON matches (deleted_at) WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_matches_last_message_at ON matches (last_message_at DESC) WHERE deleted_at IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages (match_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages (reply_to_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_phone_verification_codes_expires_at ON phone_verification_codes (expires_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes (expires_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_ip_sent ON email_verification_codes (last_ip, last_sent_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes (expires_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_ip_sent ON password_reset_codes (last_ip, last_sent_at);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks (blocker_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks (blocked_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports (reporter_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION fn_cascade_account_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at) THEN
    IF (NEW.deleted_at IS NOT NULL) THEN
      UPDATE pets
        SET deleted_at = NEW.deleted_at
        WHERE account_id = NEW.id AND deleted_at IS NULL;

      UPDATE matches
        SET deleted_at = NEW.deleted_at
        WHERE (user_one_id = NEW.id OR user_two_id = NEW.id)
          AND deleted_at IS NULL;
    ELSE
      UPDATE pets
        SET deleted_at = NULL
        WHERE account_id = NEW.id AND deleted_at = OLD.deleted_at;

      UPDATE matches
        SET deleted_at = NULL
        WHERE (user_one_id = NEW.id OR user_two_id = NEW.id)
          AND deleted_at = OLD.deleted_at;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_accounts_cascade_soft_delete ON accounts;
--> statement-breakpoint
CREATE TRIGGER trg_accounts_cascade_soft_delete
  AFTER UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION fn_cascade_account_soft_delete();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION fn_update_match_preview()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE matches
    SET last_message_id         = NEW.id,
        last_message_sender_id  = NEW.sender_id,
        last_message_type       = NEW.message_type,
        last_message_preview    = CASE
          WHEN NEW.message_type = 'text'     THEN LEFT(NEW.content, 120)
          WHEN NEW.message_type = 'image'    THEN '📷 Photo'
          WHEN NEW.message_type = 'location' THEN '📍 Location'
          ELSE NEW.content
        END,
        last_message_at = NEW.created_at
    WHERE id = NEW.match_id;

  ELSIF (TG_OP = 'DELETE') THEN
    WITH last_msg AS (
      SELECT id, sender_id, message_type, content, created_at
      FROM messages
      WHERE match_id = OLD.match_id
      ORDER BY created_at DESC
      LIMIT 1
    )
    UPDATE matches
    SET last_message_id        = (SELECT id          FROM last_msg),
        last_message_sender_id = (SELECT sender_id   FROM last_msg),
        last_message_type      = (SELECT message_type FROM last_msg),
        last_message_preview   = (
          SELECT CASE
            WHEN message_type = 'text'     THEN LEFT(content, 120)
            WHEN message_type = 'image'    THEN '📷 Photo'
            WHEN message_type = 'location' THEN '📍 Location'
            ELSE content
          END
          FROM last_msg
        ),
        last_message_at = (SELECT created_at FROM last_msg)
    WHERE id = OLD.match_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_messages_update_preview ON messages;
--> statement-breakpoint
CREATE TRIGGER trg_messages_update_preview
  AFTER INSERT OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION fn_update_match_preview();
