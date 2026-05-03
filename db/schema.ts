// 設計書 07-member-site §3 と 09-step-email-campaign §3 の DB スキーマ。
// 1st リリースでは Lemon Squeezy 系列 (pro_status / ls_* / pro_source='lemon_squeezy')
// は確保するが書き込まない (将来 Phase 3 で利用)。

import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------- enums ---------- */

export const tierEnum = pgEnum("user_tier", [
  "free",
  "pro",
  "friend",
  "banned",
]);
export const proStatusEnum = pgEnum("pro_status", [
  "trialing",
  "active",
  "past_due",
  "cancelled",
]);
export const proSourceEnum = pgEnum("pro_source", [
  "lemon_squeezy",
  "admin_grant",
  "friend_code",
]);
export const friendCodeStatusEnum = pgEnum("friend_code_status", [
  "active",
  "expired",
  "revoked",
]);
export const campaignSubscriptionStatusEnum = pgEnum(
  "campaign_subscription_status",
  ["pending", "in_progress", "completed", "unsubscribed", "failed"],
);
export const emailSendStatusEnum = pgEnum("email_send_status", [
  "queued",
  "sent",
  "delivered",
  "opened",
  "clicked",
  "bounced",
  "spam",
  "failed",
]);
export const unsubscribeSourceEnum = pgEnum("unsubscribe_source", [
  "one_click",
  "preferences_ui",
  "brevo_webhook",
  "admin",
]);

/* ---------- users ---------- */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),

    tier: tierEnum("tier").notNull().default("free"),
    proStatus: proStatusEnum("pro_status"),
    proSource: proSourceEnum("pro_source"),

    // Lemon Squeezy (1st では未使用 — Phase 3 で書き込み開始)
    lsCustomerId: text("ls_customer_id"),
    lsSubscriptionId: text("ls_subscription_id"),
    lsLicenseKey: text("ls_license_key"),
    lsTrialEndsAt: timestamp("ls_trial_ends_at", { withTimezone: true }),

    // フレンドコード (1st メイン経路)
    friendCode: text("friend_code"),
    friendExpiresAt: timestamp("friend_expires_at", { withTimezone: true }),

    isAdmin: boolean("is_admin").notNull().default(false),
    statusClaimed: boolean("status_claimed").notNull().default(true),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

    // ステップメール (09 §3)
    emailOptinMarketing: boolean("email_optin_marketing")
      .notNull()
      .default(false),
    brevoContactId: bigint("brevo_contact_id", { mode: "number" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_users_email").on(t.email),
    index("idx_users_ls_customer").on(t.lsCustomerId),
    index("idx_users_friend_code").on(t.friendCode),
  ],
);

/* ---------- Auth.js: sessions / verification_tokens / password_reset_tokens ---------- */

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

/* ---------- friend_codes (発行台帳) ---------- */

// users.friend_code は「現在使われているコード」だが、こちらは発行履歴の正本。
// 監査・再発行・revoke のために独立。
export const friendCodes = pgTable(
  "friend_codes",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    issuedToUserId: integer("issued_to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    issuedByAdminId: integer("issued_by_admin_id")
      .notNull()
      .references(() => users.id),
    durationDays: integer("duration_days").notNull().default(30),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    status: friendCodeStatusEnum("status").notNull().default("active"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_friend_codes_user").on(t.issuedToUserId),
    index("idx_friend_codes_status").on(t.status),
  ],
);

/* ---------- admin_actions (監査) ---------- */

export const adminActions = pgTable(
  "admin_actions",
  {
    id: serial("id").primaryKey(),
    adminId: integer("admin_id")
      .notNull()
      .references(() => users.id),
    targetUserId: integer("target_user_id").references(() => users.id),
    action: text("action").notNull(),
    note: text("note"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_admin_actions_target").on(t.targetUserId, t.createdAt),
    index("idx_admin_actions_admin").on(t.adminId, t.createdAt),
  ],
);

/* ---------- releases / download_audit (設計書 06 §8/§9) ---------- */

export const releases = pgTable("releases", {
  version: text("version").primaryKey(),
  blobPath: text("blob_path").notNull(),
  sha256: text("sha256").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  releaseNotesUrl: text("release_notes_url"),
  uploadedBy: integer("uploaded_by")
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const downloadAudit = pgTable(
  "download_audit",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    version: text("version").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    downloadedAt: timestamp("downloaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_download_audit_user").on(t.userId, t.downloadedAt),
    index("idx_download_audit_version").on(t.version),
  ],
);

/* ---------- ステップメール (設計書 09 §3) ---------- */

// 1 ユーザー × 1 キャンペーン = 1 行。
// friend_received は基本 1 行。`free_onboarding` を Phase 5 で追加するときも同じ table。
export const campaignSubscriptions = pgTable(
  "campaign_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignKey: text("campaign_key").notNull(),
    currentStep: integer("current_step").notNull().default(0),
    nextSendAt: timestamp("next_send_at", { withTimezone: true }),
    status: campaignSubscriptionStatusEnum("status")
      .notNull()
      .default("pending"),
    referenceId: text("reference_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("uniq_user_campaign").on(t.userId, t.campaignKey),
    index("idx_campaign_next_send").on(t.status, t.nextSendAt),
  ],
);

export const emailSendLog = pgTable(
  "email_send_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    campaignKey: text("campaign_key").notNull(),
    step: integer("step").notNull(),
    brevoMessageId: text("brevo_message_id"),
    status: emailSendStatusEnum("status").notNull().default("queued"),
    errorMessage: text("error_message"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    bouncedAt: timestamp("bounced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // 同じステップの重複送信防止 (同日 cron が二度走っても 2 行目は UNIQUE で弾く)
    uniqueIndex("uniq_send_attempt").on(t.userId, t.campaignKey, t.step),
    index("idx_send_log_brevo").on(t.brevoMessageId),
  ],
);

export const emailUnsubscribeLog = pgTable("email_unsubscribe_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  campaignKey: text("campaign_key"), // null = 全マーケティング配信から離脱
  source: unsubscribeSourceEnum("source").notNull(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  detail: jsonb("detail"),
});

/* ---------- 型エクスポート ---------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type FriendCode = typeof friendCodes.$inferSelect;
export type NewFriendCode = typeof friendCodes.$inferInsert;
export type Release = typeof releases.$inferSelect;
export type NewRelease = typeof releases.$inferInsert;
export type CampaignSubscription = typeof campaignSubscriptions.$inferSelect;
export type EmailSendLog = typeof emailSendLog.$inferSelect;

// SQL 関数を再エクスポート
export { sql };
