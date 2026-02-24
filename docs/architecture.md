# Архитектура

## Обзор

Летописец — клиент-серверное приложение с ИИ-агентами для симуляции фэнтезийного мира.

```
┌─────────────────────── БРАУЗЕР ───────────────────────┐
│  ┌──────────────┐    ┌──────────────────────────────┐ │
│  │ Letopisets   │◄──►│ FMG (iframe, self-hosted)    │ │
│  │ React UI     │    │ + postMessage bridge          │ │
│  │ (русский)    │    └──────────────────────────────┘ │
│  └──────┬───────┘                                     │
└─────────┼─────────────────────────────────────────────┘
          │ REST + WebSocket
┌─────────▼─────────────────────────────────────────────┐
│                  BACKEND (Fastify)                     │
│  ┌────────┐  ┌───────────┐  ┌──────────────────────┐ │
│  │REST API│  │WebSocket  │  │FMG Data Bridge       │ │
│  └───┬────┘  └─────┬─────┘  └──────────┬───────────┘ │
│      └─────────────┼──────────────────┬─┘             │
│           ┌────────▼────────┐  ┌──────▼──────┐        │
│           │ Simulation      │  │ Agent        │        │
│           │ Engine (тики)   │  │ Orchestrator │        │
│           └────────┬────────┘  │ (Claude API) │        │
│                    │           └──┬───┬───┬───┘        │
│                    │          ┌───┘   │   └───┐        │
│                    │     Политика Экономика Военный    │
│           ┌────────▼────────┐  Бестиарий NPC События  │
│           │ PostgreSQL +    │                          │
│           │ Redis (BullMQ)  │                          │
│           └─────────────────┘                          │
└────────────────────────────────────────────────────────┘
```

## Компоненты

### Frontend (`packages/client`)

React 19 приложение с Vite и Tailwind CSS.

- **Роутинг**: React Router (`/`, `/worlds`, `/worlds/:id`)
- **Стейт**: Zustand (локальный) + TanStack Query (серверный)
- **i18n**: react-i18next, все строки на русском (`packages/shared/src/i18n/ru/`)
- **Карта**: iframe с Azgaar FMG + postMessage bridge (планируется)
- **Реалтайм**: WebSocket-клиент для получения событий симуляции

### Backend (`packages/server`)

Fastify 5 сервер на TypeScript.

- **REST API**: CRUD миров, сущностей, управление симуляцией (`src/routes/`)
- **WebSocket**: Реалтайм-нотификации о событиях мира (`/ws`)
- **БД**: PostgreSQL 16 через Drizzle ORM (`src/db/schema.ts`)
- **Очередь задач**: BullMQ + Redis для тиков симуляции
- **ИИ-агенты**: Claude API через @anthropic-ai/sdk (`src/agents/`)

### Shared (`packages/shared`)

Общий код между frontend и backend.

- **Zod-схемы**: Валидация данных (`src/schemas/`)
- **Типы FMG**: TypeScript-определения для Azgaar Fantasy Map Generator (`src/types/fmg.ts`)
- **i18n**: Переводы на русский (`src/i18n/ru/common.json`)

## Поток данных

### Импорт мира из FMG

```
FMG (Full JSON export)
  → POST /api/worlds (upload)
  → fmg-bridge/parser.ts (конвертация FMG → наши сущности)
  → PostgreSQL (states, burgs, cultures, religions)
  → ИИ-агенты обогащают данные (NPC, существа, торговые пути)
```

### Тик симуляции

```
1. BullMQ запускает тик
2. Загрузка текущего состояния мира из БД
3. Оркестратор решает, какие агенты работают
4. Каждый агент получает контекст (рабочая память)
5. Агенты возвращают структурированные действия (JSON)
6. Действия применяются к состоянию мира
7. Новые события записываются в world_events
8. Память агентов обновляется
9. Результаты отправляются клиентам через WebSocket
```

### Реалтайм-обновления

```
Сервер (событие тика)
  → WebSocket broadcast
  → Клиент обновляет UI (таймлайн, карта, панели сущностей)
```

## Структура директорий

```
packages/
├── shared/
│   └── src/
│       ├── schemas/          # Zod-схемы: world, state, burg, culture,
│       │                     #   religion, npc, creature, event
│       ├── types/fmg.ts      # Типы данных Azgaar FMG
│       └── i18n/ru/          # Русские переводы
├── client/
│   └── src/
│       ├── app/              # App, Router, Layout
│       ├── pages/            # Страницы (Home, Worlds, WorldDetail)
│       ├── features/         # Модули по фичам (планируется)
│       ├── components/       # Переиспользуемые компоненты
│       ├── stores/           # Zustand-сторы
│       └── lib/              # api.ts, ws.ts, i18n.ts
└── server/
    └── src/
        ├── routes/           # Fastify-плагины маршрутов
        ├── services/         # Бизнес-логика
        ├── simulation/       # Тиковый цикл, состояние мира
        ├── agents/           # Оркестратор, промпты, инструменты, память
        ├── db/               # Drizzle-схема и миграции
        ├── plugins/          # Fastify-плагины (db, redis)
        └── ws/               # WebSocket handler
```

## Порты

| Сервис | Порт | Описание |
|--------|------|---------|
| Frontend (dev) | 5173 | Vite dev server |
| Backend | 3000 | Fastify API + WebSocket |
| PostgreSQL | 5432 | База данных |
| Redis | 6379 | Очередь задач, кеш |
