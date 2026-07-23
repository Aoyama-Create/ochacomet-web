ALTER TABLE "users" ADD COLUMN "failed_login_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lockout_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_otp_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_otp_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "admin_otp_attempts" integer DEFAULT 0 NOT NULL;