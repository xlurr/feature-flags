# ff-manager

Feature flags management panel. Go backend, React frontend, PostgreSQL + SQLite.

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

## Функции

### Dashboard

Показывает общее число флагов, количество активных флагов в production, число событий аудита, статистику по окружениям и последние изменения.

### Feature Flags

Позволяет искать флаги по имени и ключу, создавать и удалять флаги, переключать их состояние по окружениям, работать с targeting rules и rollout weight.

### Audit Log

Показывает историю изменений: кто, что и когда изменил. Типы событий: CREATE, DELETE, TOGGLE, UPDATE_RULES.

### Eval API

Публичный endpoint для получения состояния флагов по API-ключу окружения.

GET /eval/:apiKey

Ответ: { "flag_key": true }

---

## Структура проекта

ff-manager/
├── backend/
│ ├── cmd/server/
│ ├── internal/
│ │ ├── adapters/http/
│ │ ├── domain/
│ │ └── ports/
│ └── migrations/
├── client/
│ └── src/
│ ├── pages/
│ └── components/
├── server/
├── shared/
├── Dockerfile.frontend
├── backend/Dockerfile
└── docker-compose.yml

---

## Нюансы

- SQLite хранится в Docker volume и не теряется после docker-compose down
- PostgreSQL инициализируется миграцией из backend/migrations
- version в docker-compose.yml убран — в Compose v2 он устарел
