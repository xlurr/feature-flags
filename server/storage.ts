import {
  type User,
  type InsertUser,
  users,
  type Project,
  type InsertProject,
  projects,
  type Environment,
  type InsertEnvironment,
  environments,
  type FeatureFlag,
  type InsertFeatureFlag,
  featureFlags,
  type FlagState,
  type InsertFlagState,
  flagStates,
  type AuditEvent,
  type InsertAuditEvent,
  auditEvents,
  type FlagWithStates,
  type AuditEventFull,
  type DashboardStats,
} from '@shared/schema'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import Database from 'better-sqlite3'
import { eq, desc, and, sql, count } from 'drizzle-orm'

const sqlite = new Database('./data/data.db')
sqlite.pragma('journal_mode = WAL')

export const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './migrations' })

export interface IStorage {
  /* Users */
  getUser(id: number): Promise<User | undefined>
  getUserByEmail(email: string): Promise<User | undefined>
  getUsers(): Promise<User[]>
  createUser(user: InsertUser): Promise<User>

  /* Projects */
  getProjects(): Promise<Project[]>
  getProject(id: number): Promise<Project | undefined>
  createProject(project: InsertProject): Promise<Project>

  /* Environments */
  getEnvironmentsByProject(projectId: number): Promise<Environment[]>
  getEnvironment(id: number): Promise<Environment | undefined>
  createEnvironment(env: InsertEnvironment): Promise<Environment>

  /* Feature Flags */
  getFlags(projectId: number): Promise<FlagWithStates[]>
  getFlag(id: number): Promise<FlagWithStates | undefined>
  createFlag(flag: InsertFeatureFlag): Promise<FeatureFlag>
  deleteFlag(id: number): Promise<void>

  /* Flag States */
  getFlagState(flagId: number, environmentId: number): Promise<FlagState | undefined>
  upsertFlagState(state: InsertFlagState): Promise<FlagState>
  toggleFlagState(flagId: number, environmentId: number): Promise<FlagState>

  /* Audit */
  getAuditEvents(projectId?: number, limit?: number): Promise<AuditEventFull[]>
  createAuditEvent(event: InsertAuditEvent): Promise<AuditEvent>

  /* Dashboard */
  getDashboardStats(projectId: number): Promise<DashboardStats>

  /* Seed */
  seed(): Promise<void>
}

export class DatabaseStorage implements IStorage {
  /* ── Users ── */
  async getUser(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get()
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.email, email)).get()
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).all()
  }

  async createUser(user: InsertUser): Promise<User> {
    return db.insert(users).values(user).returning().get()
  }

  /* ── Projects ── */
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).all()
  }

  async getProject(id: number): Promise<Project | undefined> {
    return db.select().from(projects).where(eq(projects.id, id)).get()
  }

  async createProject(project: InsertProject): Promise<Project> {
    return db.insert(projects).values(project).returning().get()
  }

  /* ── Environments ── */
  async getEnvironmentsByProject(projectId: number): Promise<Environment[]> {
    return db.select().from(environments).where(eq(environments.projectId, projectId)).all()
  }

  async getEnvironment(id: number): Promise<Environment | undefined> {
    return db.select().from(environments).where(eq(environments.id, id)).get()
  }

  async createEnvironment(env: InsertEnvironment): Promise<Environment> {
    return db.insert(environments).values(env).returning().get()
  }

  async rotateApiKey(envId: number): Promise<Environment | undefined> {
    const newKey = 'ff_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    db.update(environments).set({ clientApiKey: newKey }).where(eq(environments.id, envId)).run();
    return db.select().from(environments).where(eq(environments.id, envId)).get();
  }

  async deleteEnvironment(id: number): Promise<void> {
    // Delete flag states for this environment first
    db.delete(flagStates).where(eq(flagStates.environmentId, id)).run();
    db.delete(environments).where(eq(environments.id, id)).run();
  }

  /* ── Feature Flags ── */
  async getFlags(projectId: number): Promise<FlagWithStates[]> {
    const flags = db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.projectId, projectId))
      .orderBy(desc(featureFlags.createdAt))
      .all()

    const envs = db.select().from(environments).where(eq(environments.projectId, projectId)).all()

    const result: FlagWithStates[] = []

    for (const flag of flags) {
      const states: Record<string, FlagState> = {}

      for (const env of envs) {
        const state = db
          .select()
          .from(flagStates)
          .where(and(eq(flagStates.flagId, flag.id), eq(flagStates.environmentId, env.id)))
          .get()

        if (state) {
          states[env.envKey] = state
        }
      }

      const author = flag.authorId ? db.select().from(users).where(eq(users.id, flag.authorId)).get() : undefined

      result.push({
        ...flag,
        states,
        authorName: author?.fullName,
      })
    }

    return result
  }

  async getFlag(id: number): Promise<FlagWithStates | undefined> {
    const flag = db.select().from(featureFlags).where(eq(featureFlags.id, id)).get()
    if (!flag) return undefined

    const envs = db.select().from(environments).where(eq(environments.projectId, flag.projectId)).all()

    const states: Record<string, FlagState> = {}
    for (const env of envs) {
      const state = db
        .select()
        .from(flagStates)
        .where(and(eq(flagStates.flagId, flag.id), eq(flagStates.environmentId, env.id)))
        .get()
      if (state) {
        states[env.envKey] = state
      }
    }

    const author = flag.authorId ? db.select().from(users).where(eq(users.id, flag.authorId)).get() : undefined

    return { ...flag, states, authorName: author?.fullName }
  }

  async createFlag(flag: InsertFeatureFlag): Promise<FeatureFlag> {
    const created = db.insert(featureFlags).values(flag).returning().get()

    // Auto-create flag states for all environments
    const envs = db.select().from(environments).where(eq(environments.projectId, flag.projectId)).all()

    const now = new Date().toISOString()
    for (const env of envs) {
      db.insert(flagStates)
        .values({
          flagId: created.id,
          environmentId: env.id,
          isEnabled: false,
          targetingRules: '[]',
          rolloutWeight: 100,
          updatedAt: now,
        })
        .run()
    }

    return created
  }

  async deleteFlag(id: number): Promise<void> {
    db.delete(flagStates).where(eq(flagStates.flagId, id)).run()
    db.delete(featureFlags).where(eq(featureFlags.id, id)).run()
  }

  /* ── Flag States ── */
  async getFlagState(flagId: number, environmentId: number): Promise<FlagState | undefined> {
    return db
      .select()
      .from(flagStates)
      .where(and(eq(flagStates.flagId, flagId), eq(flagStates.environmentId, environmentId)))
      .get()
  }

  async upsertFlagState(state: InsertFlagState): Promise<FlagState> {
    const existing = await this.getFlagState(state.flagId, state.environmentId)
    if (existing) {
      db.update(flagStates)
        .set({
          isEnabled: state.isEnabled,
          targetingRules: state.targetingRules,
          rolloutWeight: state.rolloutWeight,
          updatedAt: state.updatedAt,
        })
        .where(eq(flagStates.id, existing.id))
        .run()
      return { ...existing, ...state }
    }
    return db.insert(flagStates).values(state).returning().get()
  }

  async toggleFlagState(flagId: number, environmentId: number): Promise<FlagState> {
    const existing = await this.getFlagState(flagId, environmentId)
    if (!existing) throw new Error('Flag state not found')

    const now = new Date().toISOString()
    db.update(flagStates)
      .set({ isEnabled: !existing.isEnabled, updatedAt: now })
      .where(eq(flagStates.id, existing.id))
      .run()

    return { ...existing, isEnabled: !existing.isEnabled, updatedAt: now }
  }

  /* ── Audit ── */
  async getAuditEvents(_projectId?: number, limit: number = 50): Promise<AuditEventFull[]> {
    const events = db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(limit).all()

    return events.map(event => {
      const actor = event.actorId ? db.select().from(users).where(eq(users.id, event.actorId)).get() : undefined
      const flag = event.flagId
        ? db.select().from(featureFlags).where(eq(featureFlags.id, event.flagId)).get()
        : undefined
      const env = event.environmentId
        ? db.select().from(environments).where(eq(environments.id, event.environmentId)).get()
        : undefined

      return {
        ...event,
        actorName: actor?.fullName ?? 'System',
        flagKey: flag?.flagKey,
        envKey: env?.envKey,
      }
    })
  }

  async createAuditEvent(event: InsertAuditEvent): Promise<AuditEvent> {
    return db.insert(auditEvents).values(event).returning().get()
  }

  /* ── Dashboard ── */
  async getDashboardStats(projectId: number): Promise<DashboardStats> {
    const flags = db.select().from(featureFlags).where(eq(featureFlags.projectId, projectId)).all()
    const envs = db.select().from(environments).where(eq(environments.projectId, projectId)).all()

    const totalFlags = flags.length

    // Count active in production
    const prodEnv = envs.find(e => e.envKey === 'production')
    let activeInProduction = 0
    if (prodEnv) {
      const activeStates = db
        .select({ cnt: count() })
        .from(flagStates)
        .where(and(eq(flagStates.environmentId, prodEnv.id), eq(flagStates.isEnabled, true)))
        .get()
      activeInProduction = activeStates?.cnt ?? 0
    }

    const allAudit = db.select({ cnt: count() }).from(auditEvents).get()
    const auditEventsCount = allAudit?.cnt ?? 0

    const envStats = []
    for (const env of envs) {
      const activeResult = db
        .select({ cnt: count() })
        .from(flagStates)
        .where(and(eq(flagStates.environmentId, env.id), eq(flagStates.isEnabled, true)))
        .get()
      envStats.push({
        name: env.name,
        active: activeResult?.cnt ?? 0,
        total: totalFlags,
      })
    }

    const recentAudit = await this.getAuditEvents(projectId, 5)

    return { totalFlags, activeInProduction, auditEventsCount, envStats, recentAudit }
  }

  /* ── Seed ── */
  async seed(): Promise<void> {
    const existingProjects = db.select().from(projects).all()
    if (existingProjects.length > 0) return

    const now = new Date().toISOString()

    // Create admin user
    const admin = db
      .insert(users)
      .values({
        email: 'admin@system.local',
        passwordHash: 'hashed_password',
        role: 'admin',
        fullName: 'Администратор',
        isActive: true,
        lastLoginAt: now,
      })
      .returning()
      .get()

    const pm = db
      .insert(users)
      .values({
        email: 'pm@system.local',
        passwordHash: 'hashed_password',
        role: 'manager',
        fullName: 'Иван Петров',
        isActive: true,
        lastLoginAt: now,
      })
      .returning()
      .get()

    // Create project
    const project = db
      .insert(projects)
      .values({
        projectKey: 'ff-demo',
        name: 'Feature Flags Demo',
        description: 'Демонстрационный проект управления флагами',
        createdAt: now,
      })
      .returning()
      .get()

    // Create environments
    const devEnv = db
      .insert(environments)
      .values({
        projectId: project.id,
        envKey: 'development',
        name: 'Development',
        clientApiKey: 'ff_dev_' + crypto.randomUUID().slice(0, 8),
        createdAt: now,
      })
      .returning()
      .get()

    const stagingEnv = db
      .insert(environments)
      .values({
        projectId: project.id,
        envKey: 'staging',
        name: 'Staging',
        clientApiKey: 'ff_stg_' + crypto.randomUUID().slice(0, 8),
        createdAt: now,
      })
      .returning()
      .get()

    const prodEnv = db
      .insert(environments)
      .values({
        projectId: project.id,
        envKey: 'production',
        name: 'Production',
        clientApiKey: 'ff_prod_' + crypto.randomUUID().slice(0, 8),
        createdAt: now,
      })
      .returning()
      .get()

    // Seed flags
    const seedFlags = [
      {
        flagKey: 'stripe-checkout-v2',
        name: 'Stripe Checkout v2',
        description: 'Новый флоу оплаты через Stripe Elements с поддержкой Apple Pay и Google Pay',
        states: { development: true, staging: true, production: true },
        rules: { production: JSON.stringify([{ type: 'percentage', value: 10 }]) },
        rollout: { production: 10 },
      },
      {
        flagKey: 'zendesk-ai-bot',
        name: 'Zendesk AI Support Bot',
        description: 'Интеграция умного бота Zendesk Advanced AI для первой линии поддержки',
        states: { development: true, staging: true, production: true },
        rules: {
          production: JSON.stringify([
            { type: 'user_group', value: 'beta-testers' },
            { type: 'user_group', value: 'premium-subscribers' },
          ]),
        },
        rollout: {},
      },
      {
        flagKey: 'datadog-rum-tracking',
        name: 'Datadog RUM',
        description: 'Сбор аналитики Real User Monitoring через Datadog Browser SDK',
        states: { development: false, staging: true, production: true },
        rules: {
          staging: JSON.stringify([{ type: 'percentage', value: 50 }]),
          production: JSON.stringify([{ type: 'percentage', value: 5 }]),
        },
        rollout: { staging: 50, production: 5 },
      },
      {
        flagKey: 'algolia-search-v3',
        name: 'Algolia Neural Search',
        description: 'Включает нейронный поиск Algolia (векторный поиск) вместо обычного полнотекстового',
        states: { development: true, staging: true, production: false },
        rules: {},
        rollout: {},
      },
      {
        flagKey: 'intercom-onboarding-tour',
        name: 'Intercom Product Tour',
        description: 'Отображает интерактивный тур по продукту для новых пользователей через Intercom',
        states: { development: true, staging: true, production: true },
        rules: { production: JSON.stringify([{ type: 'user_group', value: 'new-signups' }]) },
        rollout: {},
      },
    ]

    const envMap: Record<string, typeof devEnv> = {
      development: devEnv,
      staging: stagingEnv,
      production: prodEnv,
    }

    for (const sf of seedFlags) {
      const flag = db
        .insert(featureFlags)
        .values({
          projectId: project.id,
          authorId: pm.id,
          flagKey: sf.flagKey,
          name: sf.name,
          description: sf.description,
          isPermanent: false,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get()

      for (const [envKey, env] of Object.entries(envMap)) {
        db.insert(flagStates)
          .values({
            flagId: flag.id,
            environmentId: env.id,
            isEnabled: sf.states[envKey as keyof typeof sf.states] ?? false,
            targetingRules: (sf.rules as any)[envKey] ?? '[]',
            rolloutWeight: (sf.rollout as any)[envKey] ?? 100,
            updatedAt: now,
          })
          .run()
      }
    }

    // Seed audit event
    db.insert(auditEvents)
      .values({
        flagId: 1,
        actorId: admin.id,
        environmentId: prodEnv.id,
        eventType: 'TOGGLE',
        diffPayload: JSON.stringify({ field: 'rollout_weight', from: 0, to: 10 }),
        createdAt: '2026-03-18T14:30:00Z',
      })
      .run()
  }
}

export const storage = new DatabaseStorage()
