# FF Manager

Self-hosted feature flags management system. An analog of LaunchDarkly / Unleash built with Go, React and PostgreSQL.

![FF Manager Dashboard](docs/dashboard.png)

Supports multi-environment flag management (dev / staging / production), rollout by percentage via CRC32 hash, real-time UI updates through SSE, in-memory eval cache with sub-millisecond latency, targeting rules, audit logging and API key rotation.

---

## Stack

| Layer | Technology |
|---|---|
| Backend API | Go 1.24, chi router, pgx/v5 (raw SQL, no ORM) |
| Database | PostgreSQL 16, JSONB for targeting rules |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui |
| State | TanStack Query (server), Jotai (client) |
| Real-time | Server-Sent Events (SSE) |
| i18n | Custom React Context (RU / EN) |
| Animations | Framer Motion, CSS keyframes |
| Proxy | Nginx 1.27 |
| Infra | Docker Compose, multi-stage builds |

---

## Architecture

```
Client (React SPA)
  |
  |-- REST (/api/*)  -->  Go Backend (chi)  -->  PostgreSQL
  |-- SSE  (/api/stream)    |                      |
  |-- Eval (/eval/:key)     +-- EventBus           +-- JSONB targeting_rules
                             +-- InMemoryCache       +-- audit_events
                                  (TTL 5min)          +-- flag_states
```

**Clean Architecture** is strictly enforced on the backend:

```
domain/       entities, sentinel errors
ports/        interfaces for repositories and services
services/     business logic (FlagService, AuditService, DashboardService)
adapters/
  http/       chi handlers, SSE streaming
  postgres/   pgx repositories
```

All dependencies point inward. HTTP handlers call services through interfaces. Services call repositories through interfaces. No SQL in services, no business logic in handlers.

---

## Key Features

**Eval API** - `GET /eval/:apiKey` returns all flag states for an environment as `{ "flag-key": true }`. Backed by an in-memory cache with TTL expiration and per-environment / per-project invalidation indexes. Rollout weight is evaluated deterministically via `CRC32(flagID) % 100`.

**SSE Real-time** - `GET /api/stream/:projectId` sends a SNAPSHOT on connect, then streams FLAG_CHANGE events. The frontend invalidates TanStack Query cache on each event, so the UI updates instantly when a flag is toggled.

**Targeting Rules** - per-environment configuration with rollout percentage slider (0-100%) and rule types: percentage, user_id, user_group, email_domain, country, custom attribute. Stored as JSONB in PostgreSQL.

**API Key Management** - create, rotate and delete environment API keys. Key rotation generates a new UUID-based key; the old one stops working immediately.

**Audit Log** - every CREATE, DELETE, TOGGLE and UPDATE_RULES event is recorded with actor, timestamp and diff payload. Audit creation failures are logged, not silently swallowed.

**Demo Page** - tech stack showcase with pixel-art icons and an interactive guided tour (8 steps) built on Jotai atoms and Framer Motion. The tour navigates between real application pages, highlighting UI elements with a CSS clip-path spotlight.

---

## API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service status + DB ping |
| GET | `/eval/{apiKey}` | Evaluate all flags for environment |
| GET | `/api/stream/{projectId}` | SSE event stream |
| GET | `/api/dashboard/{projectId}` | Dashboard stats |
| GET | `/api/flags/{projectId}` | List flags with states |
| POST | `/api/flags` | Create flag |
| DELETE | `/api/flags/{id}` | Delete flag |
| PUT | `/api/flags/{flagId}/toggle/{envId}` | Toggle flag |
| PUT | `/api/flag-states/{flagId}/{envId}` | Update targeting rules and rollout |
| GET | `/api/environments/{projectId}` | List environments |
| POST | `/api/environments` | Create environment |
| POST | `/api/environments/{id}/rotate-key` | Rotate API key |
| DELETE | `/api/environments/{id}` | Delete environment |
| GET | `/api/audit` | Audit log (limit 1-500) |

### Eval API example

```bash
curl http://localhost/eval/prod-key-001
```

```json
{
  "stripe-checkout-v2": true,
  "zendesk-ai-bot": true,
  "datadog-rum": false
}
```

---

## Quick Start

Requirements: Docker Desktop

```bash
git clone https://github.com/xlurr/ff-manager
cd ff-manager
docker-compose up --build
```

Open [http://localhost](http://localhost). Login: `admin@ff.local` / `admin123`.

### Local development (without Docker)

```bash
# Frontend + BFF server
npm install && npm run dev

# Go backend (requires PostgreSQL)
cd backend && go run ./cmd/server

# Database only
docker-compose up postgres
```

---

## Project Structure

```
ff-manager/
  backend/
    cmd/server/              main.go, dependency injection
    internal/
      domain/                entities, sentinel errors
      ports/                 repository and service interfaces
      services/              FlagService, AuditService, DashboardService
                             EventBus, InMemoryCache
      adapters/
        http/                chi handlers, SSE streaming
        postgres/            pgx repositories (raw SQL)
    migrations/
      001_init.sql           schema + seed data

  client/src/
    pages/                   Dashboard, Flags, Audit, Eval, Demo, Settings
    components/
      ui/                    shadcn/ui (47 components)
      tour/                  TourOverlay, TourTooltip, TourProvider
      FlagTargetingPanel     per-env targeting rules editor
    atoms/                   Jotai atoms (tour state)
    hooks/                   useProjectStream (SSE)
    lib/                     i18n, queryClient, constants

  server/                    Express + SQLite (BFF, dev mode)
  shared/schema.ts           Drizzle schemas, Zod validators
  nginx/nginx.conf
  docker-compose.yml
```

---

## Environment Variables

| Variable | Default | Service |
|---|---|---|
| PORT | 8080 | backend |
| DATABASE_URL | postgres://ff_user:...@postgres:5432/ff_manager | backend |
| PORT | 3000 | frontend |
| NODE_ENV | production | frontend |

---

## Roadmap

- [x] Stage 0-3: Database, repositories, services, DI, Nginx
- [x] Stage 4: In-memory eval cache (TTL, per-env invalidation)
- [x] Stage 5: SSE real-time updates (EventBus + frontend integration)
- [x] Stage 7: Targeting rules UI (rollout slider, user groups, country)
- [ ] Stage 6: JWT authentication, httpOnly cookies, RBAC
- [ ] Stage 8: Go SDK for microservices (SSE + polling)
- [ ] Stage 9: Prometheus metrics, OpenTelemetry tracing
- [ ] Stage 10: Multi-project support

---

## License

MIT
