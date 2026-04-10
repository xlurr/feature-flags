import type { Express } from "express";
import { createServer, type Server } from "http";
import crypto from "crypto";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
// resolveProjectId: принимает UUID (Go/Postgres) или числовой id (SQLite BFF)
function resolveProjectId(rawId: string): number {
  if (rawId === "00000000-0000-0000-0000-000000000001") return 1;
  const n = parseInt(rawId, 10);
  return isNaN(n) ? 1 : n;
}

  // Seed database on first run
  await storage.seed();

  /* ── Dashboard ── */
  app.get("/api/dashboard/:projectId", async (req, res) => {
    try {
      const projectId = resolveProjectId(req.params.projectId);
      const stats = await storage.getDashboardStats(projectId);
    const normalized = {
      ...stats,
      envStats: (stats.envStats as any[]).map((env: any) => ({
        envKey: env.envKey ?? String(env.name).toLowerCase().replace(/\s+/g, "-"),
        name: env.name,
        activeCount: env.activeCount ?? env.active ?? 0,
        totalCount: env.totalCount ?? env.total ?? 0,
      })),
      recentAudit: (stats.recentAudit as any[]).map((e: any) => ({
        id: String(e.id),
        flagId: e.flagId != null ? String(e.flagId) : null,
        actorId: e.actorId != null ? String(e.actorId) : null,
        environmentId: e.environmentId != null ? String(e.environmentId) : null,
        eventType: e.eventType,
        diffPayload: typeof e.diffPayload === "string" ? e.diffPayload : JSON.stringify(e.diffPayload ?? {}),
        createdAt: e.createdAt,
        actorName: e.actorName ?? "System",
        flagKey: e.flagKey ?? null,
        envKey: e.envKey ?? null,
      })),
    };
    res.json(normalized);
    } catch (error) {
      res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  /* ── Projects ── */
  app.get("/api/projects", async (_req, res) => {
    try {
      const result = await storage.getProjects();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to load projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const { projectKey, name, description } = req.body;
      const project = await storage.createProject({
        projectKey,
        name,
        description: description ?? "",
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  /* ── Environments ── */
  app.get("/api/environments/:projectId", async (req, res) => {
    try {
      const projectId = resolveProjectId(req.params.projectId);
      const envs = await storage.getEnvironmentsByProject(projectId);
      res.json(envs);
    } catch (error) {
      res.status(500).json({ error: "Failed to load environments" });
    }
  });

  app.post("/api/environments", async (req, res) => {
    try {
      const { projectId, envKey, name } = req.body;
      const pid = resolveProjectId(String(projectId));
      const clientApiKey = 'ff_' + (envKey || 'env') + '_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      const env = await storage.createEnvironment({
        projectId: pid,
        envKey: envKey || name.toLowerCase().replace(/\s+/g, '-'),
        name,
        clientApiKey,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(env);
    } catch (error) {
      res.status(500).json({ error: "Failed to create environment" });
    }
  });

  app.post("/api/environments/:id/rotate-key", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const env = await storage.rotateApiKey(id);
      if (!env) return res.status(404).json({ error: "Environment not found" });
      res.json(env);
    } catch (error) {
      res.status(500).json({ error: "Failed to rotate key" });
    }
  });

  app.delete("/api/environments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEnvironment(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete environment" });
    }
  });

  /* ── Feature Flags ── */
  app.get("/api/flags/:projectId", async (req, res) => {
    try {
      const projectId = resolveProjectId(req.params.projectId);
      const flags = await storage.getFlags(projectId);
    const nFlags = (flags as any[]).map((f: any) => ({
      ...f,
      id: String(f.id),
      projectId: String(f.projectId),
      authorId: f.authorId != null ? String(f.authorId) : null,
      archivedAt: f.archivedAt ?? null,
      isStale: false,
      daysSinceActivity: 0,
      states: Object.fromEntries(
        Object.entries(f.states ?? {}).map(([k, v]: [string, any]) => [
          k, { ...v, id: String(v.id), flagId: String(v.flagId), environmentId: String(v.environmentId) }
        ])
      ),
    }));
    res.json(nFlags);
    } catch (error) {
      res.status(500).json({ error: "Failed to load flags" });
    }
  });

  app.get("/api/flag/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const flag = await storage.getFlag(id);
      if (!flag) return res.status(404).json({ error: "Flag not found" });
      res.json(flag);
    } catch (error) {
      res.status(500).json({ error: "Failed to load flag" });
    }
  });

  app.post("/api/flags", async (req, res) => {
    try {
      const { projectId, flagKey, name, description } = req.body;
      const now = new Date().toISOString();
      const flag = await storage.createFlag({
        projectId,
        authorId: 1, // Default admin
        flagKey,
        name,
        description: description ?? "",
        isPermanent: false,
        createdAt: now,
        updatedAt: now,
      });

      await storage.createAuditEvent({
        flagId: flag.id,
        actorId: 1,
        eventType: "CREATE",
        diffPayload: JSON.stringify({ action: "Создан новый флаг" }),
        createdAt: now,
      });

      const fullFlag = await storage.getFlag(flag.id);
      res.status(201).json(fullFlag);
    } catch (error) {
      res.status(500).json({ error: "Failed to create flag" });
    }
  });

  app.delete("/api/flags/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const flag = await storage.getFlag(id);
      if (!flag) return res.status(404).json({ error: "Flag not found" });

      await storage.deleteFlag(id);
      await storage.createAuditEvent({
        flagId: id,
        actorId: 1,
        eventType: "DELETE",
        diffPayload: JSON.stringify({ action: `Флаг ${flag.flagKey} удален` }),
        createdAt: new Date().toISOString(),
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete flag" });
    }
  });

  /* ── Toggle Flag State ── */
  app.put("/api/flags/:flagId/toggle/:envId", async (req, res) => {
    try {
      const flagId = parseInt(req.params.flagId);
      const envId = parseInt(req.params.envId);

      const state = await storage.toggleFlagState(flagId, envId);
      const env = await storage.getEnvironment(envId);

      await storage.createAuditEvent({
        flagId,
        actorId: 1,
        environmentId: envId,
        eventType: "TOGGLE",
        diffPayload: JSON.stringify({
          action: `Флаг ${state.isEnabled ? "включен" : "выключен"} в ${env?.name ?? "unknown"}`,
        }),
        createdAt: new Date().toISOString(),
      });

      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle flag" });
    }
  });

  /* ── Update Flag State (rollout / rules) ── */
  app.put("/api/flag-states/:flagId/:envId", async (req, res) => {
    try {
      const flagId = parseInt(req.params.flagId);
      const envId = parseInt(req.params.envId);
      const { isEnabled, targetingRules, rolloutWeight } = req.body;

      const state = await storage.upsertFlagState({
        flagId,
        environmentId: envId,
        isEnabled: isEnabled ?? false,
        targetingRules: targetingRules ?? "[]",
        rolloutWeight: rolloutWeight ?? 100,
        updatedAt: new Date().toISOString(),
      });

      await storage.createAuditEvent({
        flagId,
        actorId: 1,
        environmentId: envId,
        eventType: "UPDATE_RULES",
        diffPayload: JSON.stringify({ targetingRules, rolloutWeight }),
        createdAt: new Date().toISOString(),
      });

      res.json(state);
    } catch (error) {
      res.status(500).json({ error: "Failed to update flag state" });
    }
  });

  /* ── Audit Log ── */
  app.get("/api/audit", async (req, res) => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 500);
      const events = await storage.getAuditEvents(undefined, limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to load audit log" });
    }
  });

  /* ── Users ── */
  app.get("/api/users", async (_req, res) => {
    try {
      const result = await storage.getUsers();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to load users" });
    }
  });

  /* ── Eval API (for client SDKs) ── */
  app.get("/api/eval/:apiKey", async (req, res) => {
    try {
      const apiKey = req.params.apiKey;
      // Find environment by API key
      const allProjects = await storage.getProjects();
      for (const project of allProjects) {
        const envs = await storage.getEnvironmentsByProject(project.id);
        const env = envs.find(e => e.clientApiKey === apiKey);
        if (env) {
          const flags = await storage.getFlags(project.id);
          const result: Record<string, boolean> = {};
          for (const flag of flags) {
            const state = flag.states[env.envKey];
            result[flag.flagKey] = state?.isEnabled ?? false;
          }
          return res.json(result);
        }
      }
      res.status(404).json({ error: "Invalid API key" });
    } catch (error) {
      res.status(500).json({ error: "Evaluation failed" });
    }
  });

  return httpServer;
}
