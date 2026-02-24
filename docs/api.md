# API

Backend работает на Fastify 5 и слушает порт 3000. Маршруты регистрируются как Fastify-плагины в `packages/server/src/routes/`.

## REST API

### Health check

```
GET /health
```

Ответ:
```json
{
  "status": "ok",
  "timestamp": "2026-02-25T12:00:00.000Z",
  "service": "letopisets-server"
}
```

### Миры

```
GET    /api/worlds              # Список всех миров
POST   /api/worlds              # Создать мир
GET    /api/worlds/:id          # Получить мир по ID
PUT    /api/worlds/:id          # Обновить мир
DELETE /api/worlds/:id          # Удалить мир (каскадно удаляет все сущности)
```

**Создание мира:**
```json
POST /api/worlds
{
  "name": "Эльдория",
  "seed": "12345"
}
```

### Импорт FMG

```
POST /api/worlds/:id/fmg/import    # Импорт JSON из Fantasy Map Generator
GET  /api/worlds/:id/fmg/export    # Экспорт в формат FMG (планируется)
```

**Импорт:**
```
POST /api/worlds/:id/fmg/import
Content-Type: application/json

{ ...FMG Full JSON export... }
```

### Сущности мира

Все эндпоинты привязаны к конкретному миру.

```
# Государства
GET    /api/worlds/:id/states
GET    /api/worlds/:id/states/:stateId

# Города
GET    /api/worlds/:id/burgs
GET    /api/worlds/:id/burgs/:burgId

# Культуры
GET    /api/worlds/:id/cultures
GET    /api/worlds/:id/cultures/:cultureId

# Религии
GET    /api/worlds/:id/religions
GET    /api/worlds/:id/religions/:religionId

# NPC
GET    /api/worlds/:id/npcs
GET    /api/worlds/:id/npcs/:npcId

# Существа (бестиарий)
GET    /api/worlds/:id/creatures
GET    /api/worlds/:id/creatures/:creatureId

# Дипломатические отношения
GET    /api/worlds/:id/diplomacy

# Торговые пути
GET    /api/worlds/:id/trade-routes
```

### События мира

```
GET /api/worlds/:id/events                # Все события
GET /api/worlds/:id/events?tick=42        # События конкретного тика
GET /api/worlds/:id/events?from=10&to=50  # События за диапазон тиков
```

### Перевод названий

```
POST /api/worlds/:id/translate    # Перевести названия сущностей на русский (SSE)
```

Эндпоинт возвращает Server-Sent Events (SSE) с прогрессом перевода.

**SSE события:**
- `start` — начало перевода, содержит `totalItems` и список `phases`
- `progress` — прогресс текущей фазы: `{ phase, status, translated, totalItems }`
- `complete` — перевод завершён: `{ translated }`
- `error` — ошибка: `{ message }`

**Порядок фаз:** states → cultures → religions → burgs

Использует Claude Haiku (`claude-haiku-4-5-20251001`) для перевода/транслитерации батчами по 100 названий. Оригинальные имена сохраняются в полях `name_original` / `deity_original`.

### Симуляция

```
POST /api/worlds/:id/simulation/start     # Запустить симуляцию
POST /api/worlds/:id/simulation/pause     # Приостановить
POST /api/worlds/:id/simulation/step      # Выполнить один тик
POST /api/worlds/:id/simulation/stop      # Остановить
GET  /api/worlds/:id/simulation/status    # Текущий статус
```

### Агенты

```
GET /api/worlds/:id/agents                # Статус всех агентов
GET /api/worlds/:id/agents/logs           # Логи вызовов агентов
GET /api/worlds/:id/agents/costs          # Расход токенов и стоимость
```

## WebSocket

Подключение: `ws://localhost:3000/ws`

### Формат сообщений

Все сообщения — JSON с полем `type`.

**Клиент → Сервер:**

```json
// Подписка на мир
{ "type": "subscribe", "worldId": "uuid-..." }

// Отписка
{ "type": "unsubscribe", "worldId": "uuid-..." }

// Ping
{ "type": "ping" }
```

**Сервер → Клиент:**

```json
// Результат тика
{
  "type": "tick",
  "worldId": "uuid-...",
  "tick": 42,
  "events": [
    {
      "type": "political",
      "title": "Альянс заключён",
      "description": "Эльдория и Норвест подписали договор...",
      "severity": "moderate"
    }
  ]
}

// Обновление сущности
{
  "type": "entity_updated",
  "worldId": "uuid-...",
  "entityType": "state",
  "entityId": "uuid-...",
  "changes": { "stability": 35 }
}

// Статус симуляции
{
  "type": "simulation_status",
  "worldId": "uuid-...",
  "status": "running",
  "currentTick": 42
}

// Pong
{ "type": "pong" }
```

## Аутентификация

В текущей версии аутентификация отсутствует. Планируется в Фазе 5.

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Мир не найден"
}
```

Коды ошибок:
- `400` — некорректный запрос (невалидные данные)
- `404` — сущность не найдена
- `409` — конфликт (например, симуляция уже запущена)
- `500` — внутренняя ошибка сервера
