# ff-manager

Веб-панель для управления feature flags — механизма, который позволяет включать и выключать функции в приложении без деплоя. Удобно для A/B-тестирования, постепенного rollout новых фич и быстрого отката в случае проблем.

Проект состоит из двух независимых частей: Go-backend с REST API и React-фронтенд с Express-сервером. Обе части запускаются через Docker Compose.

---

## Что реализовано

### Backend (Go)

- REST API на chi router
- CORS-настройка для фронтенда
- Доменная модель: проекты, окружения, флаги, состояния флагов, аудит, пользователи
- Порты и адаптеры (чистая архитектура) — слои domain / ports / adapters разделены
- Публичный Eval API — отдаёт состояние всех флагов по API-ключу окружения
- Health-check endpoint
- Структурированные JSON-логи через slog

### Frontend (React + Express)

- SPA на React 18 + Vite + Tailwind + shadcn/ui
- Express-сервер для раздачи статики и API
- SQLite через Drizzle ORM с автомиграциями при старте
- Drizzle-zod схемы для валидации

### Страницы

- Dashboard — статистика по проекту: всего флагов, активных в production, событий аудита, прогресс-бары по окружениям, лента последних изменений
- Feature Flags — список флагов с поиском, создание/удаление, переключение по окружениям, targeting rules, rollout weight
- Audit Log — полная история изменений с фильтрацией по типу события (CREATE, DELETE, TOGGLE, UPDATE_RULES)
- Settings — страница настроек (заготовка)

### Инфраструктура

- Docker Compose с тремя сервисами: postgres, backend, frontend
- Многоэтапные Dockerfile для Go и Node
- PostgreSQL 16 с автоинициализацией через init.sql
- SQLite в именованном Docker volume (данные не теряются при перезапуске)

---

## Что не реализовано (заготовки в коде)

- Аутентификация и авторизация (модели User/Role есть, логика — нет)
- Репозитории PostgreSQL (интерфейсы описаны, имплементации нет)
- Сервисный слой Go (интерфейсы описаны, имплементации нет)
- Реальное подключение backend к базе (main.go — заглушка)
- Targeting rules и rollout weight на уровне Eval API

---

## Stack

| Layer    | Tech                                          |
| -------- | --------------------------------------------- |
| Frontend | React 18, Vite, Tailwind, shadcn/ui           |
| Server   | Express + better-sqlite3 (SQLite)             |
| Backend  | Go 1.22, chi router                           |
| Database | PostgreSQL 16 (flags), SQLite (sessions/seed) |
| Infra    | Docker Compose                                |

---

## Запуск

**Требования:** Docker Desktop, Node.js 20+, Go 1.22+

### Docker

```bash
npm install
npx drizzle-kit generate
docker-compose up --build
```

Сервисы:

- Frontend - http://localhost:3000
- Backend API - http://localhost:8080
- PostgreSQL - localhost:5432

### Локально

```bash
npm install
npx drizzle-kit generate
npx drizzle-kit push
npm run dev
```

Отдельно backend:

```bash
cd backend
go run ./cmd/server
```

---

## Переменные окружения

| Переменная   | Дефолт                                                     | Где      |
| ------------ | ---------------------------------------------------------- | -------- |
| PORT         | 3000                                                       | frontend |
| PORT         | 8080                                                       | backend  |
| DATABASE_URL | postgres://ffuser:ffsecretpassword@postgres:5432/ffmanager | backend  |
| NODE_ENV     | development                                                | frontend |

---

## Структура проекта

ff-manager/
├── backend/
│ ├── cmd/server/ # точка входа
│ ├── internal/
│ │ ├── adapters/http/ # HTTP-хендлеры
│ │ ├── domain/ # сущности
│ │ └── ports/ # интерфейсы репозиториев и сервисов
│ └── migrations/ # SQL-миграции PostgreSQL
├── client/
│ └── src/
│ ├── pages/ # Dashboard, Flags, Audit, Settings
│ └── components/ # UI-компоненты (shadcn/ui)
├── server/ # Express + SQLite
├── shared/ # schema.ts (Drizzle + Zod)
├── Dockerfile.frontend
├── backend/Dockerfile
└── docker-compose.yml

---

## Нюансы

- SQLite хранится в Docker volume и не теряется после docker-compose down
- PostgreSQL инициализируется миграцией из backend/migrations автоматически
- version в docker-compose.yml убран — в Compose v2 он устарел
