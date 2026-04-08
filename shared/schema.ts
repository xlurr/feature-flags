import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* ── Projects ── */
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectKey: text("project_key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").default(""),
  createdAt: text("created_at").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

/* ── Environments ── */
export const environments = sqliteTable("environments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  envKey: text("env_key").notNull(),
  name: text("name").notNull(),
  clientApiKey: text("client_api_key").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertEnvironmentSchema = createInsertSchema(environments).omit({ id: true });
export type InsertEnvironment = z.infer<typeof insertEnvironmentSchema>;
export type Environment = typeof environments.$inferSelect;

/* ── Users ── */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("developer"),
  fullName: text("full_name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastLoginAt: text("last_login_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/* ── Feature Flags ── */
export const featureFlags = sqliteTable("feature_flags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  authorId: integer("author_id"),
  flagKey: text("flag_key").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  isPermanent: integer("is_permanent", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true });
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;
export type FeatureFlag = typeof featureFlags.$inferSelect;

/* ── Flag States (per environment) ── */
export const flagStates = sqliteTable("flag_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flagId: integer("flag_id").notNull(),
  environmentId: integer("environment_id").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  targetingRules: text("targeting_rules").default("[]"), // JSON
  rolloutWeight: integer("rollout_weight").default(100),
  updatedAt: text("updated_at").notNull(),
});

export const insertFlagStateSchema = createInsertSchema(flagStates).omit({ id: true });
export type InsertFlagState = z.infer<typeof insertFlagStateSchema>;
export type FlagState = typeof flagStates.$inferSelect;

/* ── Audit Events ── */
export const auditEvents = sqliteTable("audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flagId: integer("flag_id"),
  actorId: integer("actor_id"),
  environmentId: integer("environment_id"),
  eventType: text("event_type").notNull(),
  diffPayload: text("diff_payload").default("{}"), // JSON
  createdAt: text("created_at").notNull(),
});

export const insertAuditEventSchema = createInsertSchema(auditEvents).omit({ id: true });
export type InsertAuditEvent = z.infer<typeof insertAuditEventSchema>;
export type AuditEvent = typeof auditEvents.$inferSelect;

/* ── Composite types for API responses ── */
export type FlagWithStates = FeatureFlag & {
  states: Record<string, FlagState>;
  authorName?: string;
};

export type AuditEventFull = AuditEvent & {
  actorName?: string;
  flagKey?: string;
  envKey?: string;
};

export type DashboardStats = {
  totalFlags: number;
  activeInProduction: number;
  auditEventsCount: number;
  envStats: Array<{ name: string; active: number; total: number }>;
  recentAudit: AuditEventFull[];
};

// ---------------------
// API models (Go backend contract)
// ---------------------

export interface ApiEnvironment {
  id: string;
  projectId: string;
  envKey: string;
  name: string;
  clientApiKey: string;
  createdAt: string;
}

export interface ApiTargetingRule {
  type: string;
  value: unknown;
}

export interface ApiFlagState {
  id: string;
  flagId: string;
  environmentId: string;
  isEnabled: boolean;
  targetingRules: ApiTargetingRule[];
  rolloutWeight: number;
  updatedAt: string;
}

export interface ApiFeatureFlag {
  id: string;
  projectId: string;
  authorId: string | null;
  flagKey: string;
  name: string;
  description: string | null;
  isPermanent: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiFlagWithStates extends ApiFeatureFlag {
  authorName?: string;
  states: Record<string, ApiFlagState>;
  isStale?: boolean;
  daysSinceActivity?: number;
}

export interface ApiEnvStat {
  envKey: string;
  name: string;
  activeCount: number;
  totalCount: number;
}

export interface ApiAuditEventFull {
  id: string;
  flagId: string | null;
  actorId: string | null;
  environmentId: string | null;
  eventType: string;
  diffPayload: string;
  createdAt: string;
  actorName: string;
  flagKey: string | null;
  envKey: string | null;
}

export interface ApiDashboardStats {
  totalFlags: number;
  activeInProduction: number;
  auditEventsCount: number;
  envStats: ApiEnvStat[];
  recentAudit: ApiAuditEventFull[];
}
