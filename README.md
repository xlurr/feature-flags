# FF Manager

![FF Manager Dashboard](docs/dashboard.png)

> Веб-панель для управления feature flags - включай и выключай фичи в приложении без деплоя.



Подходит для A/B-тестирования, постепенного rollout новых возможностей и быстрого отката в случае инцидента.

***

## Быстрый старт

**Требования:** Docker Desktop

```bash
git clone https://github.com/xlurr/ff-manager
cd ff-manager
docker-compose up --build
```

Открыть: [**http://localhost**](http://localhost)

***

## Что работает сейчас

### Backend (Go 1.22)

- **Чистая архитектура** - domain / ports / services / adapters полностью разделены
- **Сервисный слой** - `FlagService`, `AuditService`, `DashboardService` с бизнес-логикой
- **Eval API** - `GET /eval/{apiKey}` возвращает состояние всех флагов по API-ключу окружения
- **Rollout weight** - вероятностное включение флага через CRC32 хэш
- **Audit log** - каждый CREATE / DELETE / TOGGLE записывается автоматически
- **Health check** - `GET /health` с реальным ping к PostgreSQL
- **Graceful shutdown** - корректное завершение по SIGINT / SIGTERM
- **JSON-логи** через `log/slog`

### Frontend (React 18 + Express)

- SPA на **React 18 + Vite + Tailwind + shadcn/ui**
- **Dashboard** - всего флагов, активных в production, событий аудита, прогресс по окружениям, лента последних изменений
- **Feature Flags** - список с поиском, создание / удаление, переключение по окружениям
- **Audit Log** - полная история изменений (CREATE, DELETE, TOGGLE, UPDATE_RULES)
- **Settings** - окружения с API-ключами

### Инфраструктура

- **Nginx** как единая точка входа на порту 80 - роутит `/api/*` и `/eval/*` на Go backend
- **PostgreSQL 16** - основная БД с автоинициализацией seed-данных
- **Docker Compose** с 4 сервисами: nginx, backend, frontend, postgres

***

## API Endpoints

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/health` | Статус сервиса + ping БД |
| `GET` | `/eval/{apiKey}` | Все флаги по API-ключу |
| `GET` | `/api/dashboard/{projectId}` | Статистика проекта |
| `GET` | `/api/flags/{projectId}` | Список флагов со states |
| `POST` | `/api/flags` | Создать флаг |
| `DELETE` | `/api/flags/{id}` | Удалить флаг |
| `PUT` | `/api/flags/{flagId}/toggle/{envId}` | Переключить флаг |
| `GET` | `/api/environments/{projectId}` | Список окружений |
| `GET` | `/api/audit` | Лента аудита (последние 50) |

### Пример Eval API

```bash
curl http://localhost/eval/prod-key-001
# {"zendesk-ai-bot": true, "stripe-checkout-v2": true, "new-dashboard": false}
```

***

## Stack

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, Vite, TanStack Query, Tailwind, shadcn/ui |
| Frontend server | Express + better-sqlite3 |
| Backend | Go 1.22, chi router, pgx/v5 |
| База данных | PostgreSQL 16 |
| Прокси | Nginx 1.27 |
| Инфраструктура | Docker Compose, многоэтапные сборки |

***

## Структура проекта

```
ff-manager/
├── backend/
│   ├── cmd/server/          # main.go - точка входа, DI
│   ├── internal/
│   │   ├── domain/          # сущности + sentinel errors
│   │   ├── ports/           # интерфейсы репозиториев и сервисов
│   │   ├── services/        # бизнес-логика (Flag, Audit, Dashboard)
│   │   └── adapters/
│   │       ├── http/        # chi-хендлеры
│   │       └── postgres/    # pgx-репозитории
│   └── migrations/
│       └── 001_init.sql     # схема + seed данные
├── client/src/
│   ├── pages/               # Dashboard, Flags, Audit, Settings
│   └── components/ui/       # shadcn/ui компоненты
├── nginx/
│   └── nginx.conf
├── server/                  # Express + SQLite
├── shared/schema.ts
├── Dockerfile.frontend
├── backend/Dockerfile
└── docker-compose.yml
```

***

## Переменные окружения

| Переменная | Значение | Сервис |
|---|---|---|
| `PORT` | `8080` | backend |
| `DATABASE_URL` | `postgres://ff_user:ff_secret_password@postgres:5432/ff_manager` | backend |
| `PORT` | `3000` | frontend |
| `NODE_ENV` | `production` | frontend |

***

## Seed данные

При первом запуске PostgreSQL создаёт проект `00000000-0000-0000-0000-000000000001`:

| Окружение | API-ключ |
|---|---|
| Development | `dev-key-001` |
| Staging | `stg-key-001` |
| Production | `prod-key-001` |

***

## Roadmap

- [ ] **Stage 4** - InMemoryCache для Eval API
- [ ] **Stage 5** - SSE endpoint для realtime обновлений UI
- [ ] **Stage 6** - Аутентификация (JWT), роли Admin / Viewer
- [ ] **Stage 7** - Targeting rules: rollout по userId, % трафика
- [ ] **Stage 8** - SDK-клиент (Go / TypeScript)
- [ ] **Stage 9** - Метрики (Prometheus) + трейсинг (OpenTelemetry)
- [ ] **Stage 10** - Мультипроектность через UI

***

## Локальная разработка

```bash
# Frontend
npm install && npm run dev

# Backend
cd backend && go run ./cmd/server

# Только база
docker-compose up postgres
```
