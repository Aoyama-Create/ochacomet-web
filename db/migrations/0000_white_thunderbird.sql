CREATE TYPE "public"."campaign_subscription_status" AS ENUM('pending', 'in_progress', 'completed', 'unsubscribed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_send_status" AS ENUM('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'spam', 'failed');--> statement-breakpoint
CREATE TYPE "public"."friend_code_status" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."pro_source" AS ENUM('lemon_squeezy', 'admin_grant', 'friend_code');--> statement-breakpoint
CREATE TYPE "public"."pro_status" AS ENUM('trialing', 'active', 'past_due', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_tier" AS ENUM('free', 'pro', 'friend', 'banned');--> statement-breakpoint
CREATE TYPE "public"."unsubscribe_source" AS ENUM('one_click', 'preferences_ui', 'brevo_webhook', 'admin');--> statement-breakpoint
CREATE TABLE "admin_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"target_user_id" integer,
	"action" text NOT NULL,
	"note" text,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"campaign_key" text NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"next_send_at" timestamp with time zone,
	"status" "campaign_subscription_status" DEFAULT 'pending' NOT NULL,
	"reference_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "download_audit" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"version" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"downloaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_send_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"campaign_key" text NOT NULL,
	"step" integer NOT NULL,
	"brevo_message_id" text,
	"status" "email_send_status" DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"bounced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_unsubscribe_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"campaign_key" text,
	"source" "unsubscribe_source" NOT NULL,
	"unsubscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"detail" jsonb
);
--> statement-breakpoint
CREATE TABLE "friend_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"issued_to_user_id" integer NOT NULL,
	"issued_by_admin_id" integer NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"activated_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"status" "friend_code_status" DEFAULT 'active' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friend_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"version" text PRIMARY KEY NOT NULL,
	"blob_path" text NOT NULL,
	"sha256" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"release_notes_url" text,
	"uploaded_by" integer NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"tier" "user_tier" DEFAULT 'free' NOT NULL,
	"pro_status" "pro_status",
	"pro_source" "pro_source",
	"ls_customer_id" text,
	"ls_subscription_id" text,
	"ls_license_key" text,
	"ls_trial_ends_at" timestamp with time zone,
	"friend_code" text,
	"friend_expires_at" timestamp with time zone,
	"is_admin" boolean DEFAULT false NOT NULL,
	"status_claimed" boolean DEFAULT true NOT NULL,
	"email_verified_at" timestamp with time zone,
	"email_optin_marketing" boolean DEFAULT false NOT NULL,
	"brevo_contact_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_subscriptions" ADD CONSTRAINT "campaign_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_audit" ADD CONSTRAINT "download_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_log" ADD CONSTRAINT "email_send_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_unsubscribe_log" ADD CONSTRAINT "email_unsubscribe_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_codes" ADD CONSTRAINT "friend_codes_issued_to_user_id_users_id_fk" FOREIGN KEY ("issued_to_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_codes" ADD CONSTRAINT "friend_codes_issued_by_admin_id_users_id_fk" FOREIGN KEY ("issued_by_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_actions_target" ON "admin_actions" USING btree ("target_user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_actions_admin" ON "admin_actions" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_user_campaign" ON "campaign_subscriptions" USING btree ("user_id","campaign_key");--> statement-breakpoint
CREATE INDEX "idx_campaign_next_send" ON "campaign_subscriptions" USING btree ("status","next_send_at");--> statement-breakpoint
CREATE INDEX "idx_download_audit_user" ON "download_audit" USING btree ("user_id","downloaded_at");--> statement-breakpoint
CREATE INDEX "idx_download_audit_version" ON "download_audit" USING btree ("version");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_send_attempt" ON "email_send_log" USING btree ("user_id","campaign_key","step");--> statement-breakpoint
CREATE INDEX "idx_send_log_brevo" ON "email_send_log" USING btree ("brevo_message_id");--> statement-breakpoint
CREATE INDEX "idx_friend_codes_user" ON "friend_codes" USING btree ("issued_to_user_id");--> statement-breakpoint
CREATE INDEX "idx_friend_codes_status" ON "friend_codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_ls_customer" ON "users" USING btree ("ls_customer_id");--> statement-breakpoint
CREATE INDEX "idx_users_friend_code" ON "users" USING btree ("friend_code");