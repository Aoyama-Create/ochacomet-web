ALTER TYPE "public"."pro_source" ADD VALUE 'stripe';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "license_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pro_period_ends_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_users_stripe_customer" ON "users" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_license_key" ON "users" USING btree ("license_key");