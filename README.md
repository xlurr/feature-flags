# FF Manager

Self-hosted система управления feature flags. Аналог LaunchDarkly / Unleash на Go, React и PostgreSQL.

[English version below](#english-version)

![FF Manager Dashboard](docs/dashboard.png)

Управление флагами по окружениям (dev / staging / production), rollout по проценту через CRC32, обновление UI в реальном времени через SSE, in-memory кеш с latency менее 1 мс, targeting rules, аудит-лог и ротация API-ключей.

---

## Стек

| Слой | Технологии |
|---|---|
| Backend API | Go 1.24, chi router, pgx/v5 (чистый SQL, без ORM) |
| База данных | PostgreSQL 16, JSONB для targeting rules |
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui |
| Состояние | TanStack Query (серверное), Jotai (клиентское) |
| Real-time | Server-Sent Events (SSE) |
| i18n | React Context (RU / EN) |
| Анимации | Framer Motion, CSS keyframes |
| Прокси | Nginx 1.27 |
| Инфраструктура | Docker Compose, multi-stage сборки |

---

## Архитектура

```
Client (React SPA)
  |
  |-- REST (/api/*)  -->  Go Backend (chi)  -->  PostgreSQL
  |-- SSE  (/api/stream)    |                      |
  |-- Eval (/eval/:key)     +-- EventBus           +-- JSONB targeting_rules
                             +-- InMemoryCache       +-- audit_events
                                  (TTL 5 мин)         +-- flag_states
```

На бэкенде строго соблюдается Clean Architecture:

```
domain/       сущности, sentinel-ошибки
ports/        интерфейсы репозиториев и сервисов
services/     бизнес-логика (FlagService, AuditService, DashboardService)
adapters/
  http/       chi-хендлеры, SSE-стриминг
  postgres/   pgx-репозитории
```

Все зависимости направлены внутрь. HTTP-хендлеры вызывают сервисы через интерфейсы. Сервисы вызывают репозитории через интерфейсы. В сервисах нет SQL, в хендлерах нет бизнес-логики.

---

## Что реализовано

**Eval API** - `GET /eval/:apiKey` возвращает состояние всех флагов для окружения в формате `{ "flag-key": true }`. Под капотом in-memory кеш с TTL-экспирацией и индексами инвалидации по окружению и проекту. Rollout weight вычисляется детерминированно: `CRC32(flagID) % 100`.

**SSE Real-time** - `GET /api/stream/:projectId` отправляет SNAPSHOT при подключении, затем стримит FLAG_CHANGE события. На фронте по каждому событию инвалидируется кеш TanStack Query, UI обновляется мгновенно при переключении флага.

**Targeting Rules** - настройка per-environment с ползунком rollout (0-100%) и типами правил: percentage, user_id, user_group, email_domain, country, custom. Хранится в JSONB в PostgreSQL.

**Управление API-ключами** - создание, ротация и удаление ключей окружений. При ротации генерируется новый UUID-ключ, старый перестает работать сразу.

**Аудит-лог** - каждое событие CREATE, DELETE, TOGGLE и UPDATE_RULES записывается с актором, временем и diff payload.

**Страница Демо** - витрина стека с pixel-art иконками и интерактивным туром из 8 шагов на Jotai atoms и Framer Motion. Тур навигирует между реальными страницами приложения, подсвечивая элементы интерфейса через CSS clip-path.

---

## API

| Метод | Endpoint | Описание |
|---|---|---|
| GET | `/health` | Статус сервиса + ping БД |
| GET | `/eval/{apiKey}` | Оценка всех флагов для окружения |
| GET | `/api/stream/{projectId}` | SSE-поток событий |
| GET | `/api/dashboard/{projectId}` | Статистика дашборда |
| GET | `/api/flags/{projectId}` | Список флагов со states |
| POST | `/api/flags` | Создать флаг |
| DELETE | `/api/flags/{id}` | Удалить флаг |
| PUT | `/api/flags/{flagId}/toggle/{envId}` | Переключить флаг |
| PUT | `/api/flag-states/{flagId}/{envId}` | Обновить targeting rules и rollout |
| GET | `/api/environments/{projectId}` | Список окружений |
| POST | `/api/environments` | Создать окружение |
| POST | `/api/environments/{id}/rotate-key` | Ротировать API-ключ |
| DELETE | `/api/environments/{id}` | Удалить окружение |
| GET | `/api/audit` | Аудит-лог (limit 1-500) |

### Пример Eval API

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

## Быстрый старт

Требования: Docker Desktop

```bash
git clone https://github.com/xlurr/ff-manager
cd ff-manager
docker-compose up --build
```

Открыть [http://localhost](http://localhost). Логин: `admin@ff.local` / `admin123`.

### Локальная разработка (без Docker)

```bash
# Frontend + BFF сервер
npm install && npm run dev

# Go backend (нужен PostgreSQL)
cd backend && go run ./cmd/server

# Только база
docker-compose up postgres
```

---

## Структура проекта

```
ff-manager/
  backend/
    cmd/server/              main.go, dependency injection
    internal/
      domain/                сущности, sentinel-ошибки
      ports/                 интерфейсы репозиториев и сервисов
      services/              FlagService, AuditService, DashboardService
                             EventBus, InMemoryCache
      adapters/
        http/                chi-хендлеры, SSE-стриминг
        postgres/            pgx-репозитории (чистый SQL)
    migrations/
      001_init.sql           схема + seed-данные

  client/src/
    pages/                   Dashboard, Flags, Audit, Eval, Demo, Settings
    components/
      ui/                    shadcn/ui (47 компонентов)
      tour/                  TourOverlay, TourTooltip, TourProvider
      FlagTargetingPanel     редактор targeting rules per-env
    atoms/                   Jotai atoms (состояние тура)
    hooks/                   useProjectStream (SSE)
    lib/                     i18n, queryClient, constants

  server/                    Express + SQLite (BFF, dev mode)
  shared/schema.ts           Drizzle-схемы, Zod-валидаторы
  nginx/nginx.conf
  docker-compose.yml
```

---

## Переменные окружения

| Переменная | Значение | Сервис |
|---|---|---|
| PORT | 8080 | backend |
| DATABASE_URL | postgres://ff_user:...@postgres:5432/ff_manager | backend |
| PORT | 3000 | frontend |
| NODE_ENV | production | frontend |

---

## Дорожная карта

- [x] Stage 0-3: База данных, репозитории, сервисы, DI, Nginx
- [x] Stage 4: In-memory кеш для eval (TTL, инвалидация по env)
- [x] Stage 5: SSE real-time (EventBus + интеграция с фронтом)
- [x] Stage 7: Targeting rules UI (rollout slider, user groups, country)
- [ ] Stage 6: JWT-аутентификация, httpOnly cookies, RBAC
- [ ] Stage 8: Go SDK для микросервисов (SSE + polling)
- [ ] Stage 9: Prometheus-метрики, OpenTelemetry-трейсинг
- [ ] Stage 10: Мультипроектность

---

---

<a id="english-version"></a>

# FF Manager (English)

Self-hosted feature flags management system. An analog of LaunchDarkly / Unleash built with Go, React and PostgreSQL.

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

Clean Architecture is strictly enforced on the backend:

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

**Audit Log** - every CREATE, DELETE, TOGGLE and UPDATE_RULES event is recorded with actor, timestamp and diff payload.

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
