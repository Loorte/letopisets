# Схема базы данных

PostgreSQL 16 + Drizzle ORM. Схема определена в `packages/server/src/db/schema.ts`.

## Диаграмма связей

```
worlds ─────┬──── states ──────┬──── burgs
            │        │         │       │
            │        │         │       ├── npcs
            │        │         │       ├── creatures
            │        │         │       └── trade_routes
            │        │         │
            │        ├── diplomatic_relations
            │        └── creatures
            │
            ├──── cultures
            ├──── religions
            ├──── world_events
            ├──── agent_memories
            └──── world_snapshots
```

Все сущности привязаны к `worldId` с каскадным удалением.

## Перечисления (Enums)

| Enum | Значения |
|------|---------|
| `sim_status` | idle, running, paused |
| `government_form` | monarchy, republic, theocracy, tribal, empire, anarchy |
| `culture_type` | nomadic, river, lake, naval, hunting, highland, generic |
| `religion_type` | folk, organized, cult, heresy |
| `npc_role` | ruler, general, merchant, priest, spy, scholar, peasant, adventurer |
| `creature_category` | solo, pack, swarm |
| `threat_level` | harmless, nuisance, dangerous, deadly, legendary |
| `creature_behavior` | territorial, nomadic, predatory, passive, intelligent |
| `creature_intelligence` | beast, cunning, sentient |
| `creature_status` | alive, dead, dormant, banished |
| `event_type` | political, economic, military, social, natural, magical, creature |
| `severity` | minor, moderate, major, catastrophic |
| `memory_type` | working, long_term, reflective |
| `diplomatic_relation` | alliance, friendly, neutral, rival, war |

## Таблицы

### worlds

Основная сущность — игровой мир.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `name` | text | Название мира |
| `seed` | text | Сид генерации FMG |
| `current_tick` | integer | Текущий тик симуляции (по умолчанию 0) |
| `sim_status` | sim_status | Статус симуляции: idle / running / paused |
| `fmg_data` | JSONB | Полный JSON-снапшот карты из FMG |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### states

Государства карты. Импортируются из FMG, обогащаются ИИ-агентами.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | Каскадное удаление |
| `fmg_id` | integer | Индекс в массиве states FMG |
| `name` | text | Название государства |
| `form` | government_form | Форма правления |
| `color` | text | Цвет на карте (hex) |
| `population` | integer | Численность населения |
| `military` | real | Военная мощь (0-100) |
| `economy` | real | Экономическая мощь (0-100) |
| `stability` | real | Стабильность (0-100, по умолчанию 50) |
| `diplomacy` | JSONB | Дополнительные дипломатические данные |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### burgs

Города и поселения. Импортируются из FMG.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | Каскадное удаление |
| `state_id` | UUID FK → states | Государство-владелец |
| `fmg_id` | integer | Индекс в массиве burgs FMG |
| `name` | text | Название города |
| `population` | integer | Население |
| `is_capital` | boolean | Столица государства |
| `is_port` | boolean | Портовый город |
| `x` | real | Координата X на карте FMG |
| `y` | real | Координата Y на карте FMG |
| `economy` | real | Экономический уровень |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### cultures

Культуры мира. Импортируются из FMG, обогащаются ИИ.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `fmg_id` | integer | Индекс в массиве cultures FMG |
| `name` | text | Название культуры |
| `type` | culture_type | Тип: nomadic, river, lake, naval и др. |
| `color` | text | Цвет на карте |
| `traits` | JSONB | ИИ-сгенерированные культурные черты |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### religions

Религии мира. Импортируются из FMG.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `fmg_id` | integer | Индекс в массиве religions FMG |
| `name` | text | Название религии |
| `type` | religion_type | Тип: folk, organized, cult, heresy |
| `deity` | text | Божество |
| `color` | text | Цвет на карте |
| `tenets` | JSONB | ИИ-сгенерированные заповеди и догматы |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### npcs

Персонажи мира — правители, генералы, торговцы и др. Создаются ИИ-агентами.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `state_id` | UUID FK → states | Государство |
| `burg_id` | UUID FK → burgs | Город проживания |
| `name` | text | Имя |
| `role` | npc_role | Роль: ruler, general, merchant, priest, spy, scholar, peasant, adventurer |
| `traits` | JSONB | Черты характера: `["brave", "cunning", "greedy"]` |
| `goals` | JSONB | Цели: `["expand territory", "accumulate wealth"]` |
| `relationships` | JSONB | Отношения с другими NPC |
| `biography` | text | ИИ-сгенерированная биография |
| `is_alive` | boolean | Жив или мёртв |
| `spawn_tick` | integer | Тик рождения |
| `death_tick` | integer | Тик смерти (null, если жив) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### creatures

Бестиарий — монстры и существа фэнтезийного мира.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `name` | text | «Змей Горыныч», «Стая гоблинов из Чёрной пещеры» |
| `species` | text | Вид: dragon, vampire, goblin, werewolf, undead, elemental, demon |
| `category` | creature_category | solo (уникальный босс), pack (стая), swarm (орда) |
| `threat_level` | threat_level | harmless, nuisance, dangerous, deadly, legendary |
| `habitat` | text | Среда обитания: mountain, forest, swamp, cave, ruins, ocean |
| `home_cell` | integer | FMG cell ID — привязка к географии карты |
| `lair_burg_id` | UUID FK → burgs | Ближайший город (если логово рядом) |
| `state_id` | UUID FK → states | На территории какого государства |
| `population` | integer | Количество особей (1 для solo, N для pack/swarm) |
| `abilities` | JSONB | `{breath: "fire", flight: true, magic: ["illusion"]}` |
| `behavior` | creature_behavior | territorial, nomadic, predatory, passive, intelligent |
| `intelligence` | creature_intelligence | beast, cunning, sentient (разумные ведут переговоры) |
| `hostility` | real 0-100 | Агрессивность к людям (по умолчанию 50) |
| `treasure` | JSONB | `[{item: "gold", amount: 5000}, {item: "magic_sword"}]` |
| `biography` | text | ИИ-сгенерированная легенда существа |
| `status` | creature_status | alive, dead, dormant, banished |
| `spawn_tick` | integer | Тик появления |
| `death_tick` | integer | Тик гибели |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### world_events

История мира — все события, сгенерированные ИИ-агентами.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `tick` | integer | Тик, когда произошло событие |
| `type` | event_type | political, economic, military, social, natural, magical, creature |
| `title` | text | Заголовок на русском |
| `description` | text | Описание на русском |
| `severity` | severity | minor, moderate, major, catastrophic |
| `effects` | JSONB | `{population: -500, stability: -10}` |
| `related_entity_ids` | JSONB | `["uuid-state-a", "uuid-burg-b"]` |
| `created_at` | timestamptz | |

### agent_memories

Память ИИ-агентов — для обеспечения непрерывности симуляции.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `agent_type` | text | Тип агента: politics, economy, military, bestiary, npc, events |
| `memory_type` | memory_type | working, long_term, reflective |
| `content` | text | Содержимое памяти (текст) |
| `importance` | real 0-1 | Важность записи (по умолчанию 0.5) |
| `tick` | integer | Тик, к которому относится память |
| `created_at` | timestamptz | |

### world_snapshots

Снапшоты состояния мира для путешествия во времени.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `tick` | integer | Тик снапшота |
| `snapshot` | JSONB | Полное состояние мира |
| `fmg_data` | JSONB | Данные FMG на момент снапшота |
| `created_at` | timestamptz | |

### diplomatic_relations

Дипломатические отношения между государствами.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `state_a_id` | UUID FK → states | Первое государство |
| `state_b_id` | UUID FK → states | Второе государство |
| `relation` | diplomatic_relation | alliance, friendly, neutral, rival, war |
| `since` | integer | С какого тика действует |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### trade_routes

Торговые пути между городами.

| Поле | Тип | Описание |
|------|-----|---------|
| `id` | UUID PK | |
| `world_id` | UUID FK → worlds | |
| `source_burg_id` | UUID FK → burgs | Город отправления |
| `target_burg_id` | UUID FK → burgs | Город назначения |
| `goods` | JSONB | `[{name: "iron", volume: 100}]` |
| `revenue` | real | Доход маршрута |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

## Миграции

Файлы миграций находятся в `packages/server/src/db/migrations/`.

```bash
# Сгенерировать миграцию после изменения schema.ts
pnpm db:generate

# Применить схему напрямую (dev)
pnpm db:push

# Запустить миграции (production)
pnpm db:migrate
```
