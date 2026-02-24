# Летописец (Letopisets) — Конвенции проекта

## Обзор
RPG-система управления фэнтезийным миром. Мир генерируется через Azgaar Fantasy Map Generator, ИИ-агенты (Claude API) симулируют политику, экономику, войны, NPC и мировые события.

## Структура
- **pnpm монорепо** с Turborepo
- `packages/shared` — Zod-схемы, типы FMG, i18n (русский)
- `packages/server` — Fastify backend, Drizzle ORM, PostgreSQL
- `packages/client` — React 19, Vite, Tailwind CSS, react-i18next
- `docker/` — Docker Compose для локальной разработки

## Команды
- `pnpm dev` — запуск всех пакетов в dev-режиме
- `pnpm build` — сборка всех пакетов
- `pnpm typecheck` — проверка типов во всех пакетах
- `docker compose -f docker/docker-compose.dev.yml up -d` — PostgreSQL + Redis
- `pnpm db:generate` — генерация миграций Drizzle
- `pnpm db:push` — применение схемы к БД

## Технический стек
- **Язык**: TypeScript (strict mode)
- **Бэкенд**: Fastify 5, Drizzle ORM, PostgreSQL 16, BullMQ + Redis
- **Фронтенд**: React 19, Vite, Tailwind CSS 4, Zustand, TanStack Query
- **ИИ**: Anthropic Claude API (@anthropic-ai/sdk)
- **i18n**: react-i18next, все переводы в `packages/shared/src/i18n/ru/`

## Конвенции
- Весь UI на **русском языке** — используй ключи i18n из `common.json`
- **ESM** повсюду (`"type": "module"`, импорты с `.js` расширением на бэкенде)
- Drizzle-схема БД в `packages/server/src/db/schema.ts`
- Zod-схемы валидации в `packages/shared/src/schemas/`
- API-маршруты регистрируются как Fastify-плагины в `packages/server/src/routes/`
- WebSocket endpoint: `/ws`
- Health check: `GET /health`

## Модели данных
- Основные сущности: worlds, states, burgs, cultures, religions, npcs, creatures, worldEvents
- Все сущности привязаны к `worldId`
- FMG-сущности имеют `fmgId` для синхронизации с Fantasy Map Generator
- Creatures (бестиарий): solo/pack/swarm, threatLevel, behavior, intelligence

## Порты
- Frontend dev: `localhost:5173`
- Backend: `localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
