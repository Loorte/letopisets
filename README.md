# Летописец (Letopisets)

RPG-система управления фэнтезийным миром на основе [Azgaar Fantasy Map Generator](https://github.com/Azgaar/Fantasy-Map-Generator). ИИ-агенты (Claude API) симулируют политику, экономику, войны, бестиарий, NPC и мировые события.

## Возможности

- **Импорт карт** из Azgaar Fantasy Map Generator (JSON-экспорт)
- **ИИ-симуляция мира** — агенты управляют дипломатией, экономикой, войнами, существами
- **Бестиарий** — драконы, вампиры, гоблины, нежить и другие существа с поведением и миграциями
- **NPC** — персонажи с целями, характерами и биографиями
- **Хронология событий** — отслеживание истории мира по тикам
- **Перевод названий** — автоматический перевод названий сущностей на русский через Claude Haiku
- **Русский интерфейс** — полная локализация UI

## Быстрый старт

### Требования

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 9+
- [Docker](https://www.docker.com/) и Docker Compose

### Установка

```bash
git clone https://github.com/Loorte/letopisets.git
cd letopisets
pnpm install
```

### Запуск инфраструктуры

```bash
# PostgreSQL + Redis
docker compose -f docker/docker-compose.dev.yml up -d

# Применить схему БД
pnpm db:push
```

### Настройка окружения

```bash
cp .env.example .env
# Заполнить ANTHROPIC_API_KEY в .env
```

### Запуск в dev-режиме

```bash
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

## Структура проекта

```
letopisets/
├── packages/
│   ├── shared/     # Zod-схемы, типы FMG, i18n (русский)
│   ├── server/     # Fastify backend, Drizzle ORM, ИИ-агенты
│   └── client/     # React 19, Vite, Tailwind CSS
├── docker/         # Docker Compose для локальной разработки
└── docs/           # Документация проекта
```

Подробнее: [docs/architecture.md](docs/architecture.md)

## Технический стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4, Zustand, TanStack Query |
| Backend | Fastify 5, Drizzle ORM, PostgreSQL 16, BullMQ + Redis |
| ИИ | Claude API (@anthropic-ai/sdk) |
| Инфраструктура | Docker Compose, pnpm workspaces, Turborepo |

## Документация

- [Архитектура](docs/architecture.md) — общая архитектура системы, компоненты и их взаимодействие
- [Схема базы данных](docs/database.md) — все таблицы, поля и связи
- [ИИ-агенты](docs/agents.md) — архитектура агентов, их роли, память и управление стоимостью
- [Интеграция с FMG](docs/fmg-integration.md) — импорт карт, типы данных, синхронизация
- [API](docs/api.md) — REST-эндпоинты и WebSocket-протокол
- [Развёртывание](docs/deployment.md) — локальная разработка и деплой на сервер

## Команды

| Команда | Описание |
|---------|---------|
| `pnpm dev` | Запуск всех пакетов в dev-режиме |
| `pnpm build` | Сборка всех пакетов |
| `pnpm typecheck` | Проверка типов |
| `pnpm db:generate` | Генерация миграций Drizzle |
| `pnpm db:push` | Применение схемы к БД |
| `pnpm db:migrate` | Запуск миграций |

## Лицензия

MIT
