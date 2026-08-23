ALTER TABLE "admin_actions" DROP CONSTRAINT "admin_actions_target_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "download_audit" DROP CONSTRAINT "download_audit_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "download_audit" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "download_audit" ADD CONSTRAINT "download_audit_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;