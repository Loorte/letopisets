# Развёртывание

## Локальная разработка

### Требования

- Node.js 22+
- pnpm 9+
- Docker и Docker Compose

### Установка

```bash
git clone https://github.com/Loorte/letopisets.git
cd letopisets
pnpm install
cp .env.example .env
```

Заполнить `.env`:
```
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgres://letopisets:letopisets@localhost:5432/letopisets
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGIN=http://localhost:5173
```

### Запуск инфраструктуры

```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

Это поднимет:
- PostgreSQL 16 на порту 5432 (user/pass/db: `letopisets`)
- Redis 7 на порту 6379

### Применение схемы БД

```bash
# Прямое применение (dev)
pnpm db:push

# Или через миграции
pnpm db:migrate
```

### Запуск приложения

```bash
pnpm dev
```

- Frontend: http://localhost:5173 (Vite dev server с HMR)
- Backend: http://localhost:3000 (Fastify с auto-reload)

### Проверка

```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"...","service":"letopisets-server"}
```

## Полезные команды

| Команда | Описание |
|---------|---------|
| `pnpm dev` | Запуск всех пакетов в dev-режиме |
| `pnpm build` | Production-сборка |
| `pnpm typecheck` | Проверка TypeScript-типов |
| `pnpm db:generate` | Генерация миграции после изменения schema.ts |
| `pnpm db:push` | Прямое применение схемы к БД |
| `pnpm db:migrate` | Запуск миграций |

## Деплой на сервер (production)

### Минимальные требования к серверу

- CPU: 2 ядра
- RAM: 4 GB
- SSD: 20 GB
- ОС: Ubuntu 22.04 LTS или любой Linux с Docker

### Docker Compose (production)

Для production используется полный `docker-compose.yml` с 5 сервисами:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile.app
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://letopisets:${DB_PASSWORD}@db:5432/letopisets
      REDIS_URL: redis://redis:6379
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      NODE_ENV: production
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }

  fmg:
    build:
      context: .
      dockerfile: docker/Dockerfile.fmg
    # Доступ через nginx

  db:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: letopisets
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: letopisets
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U letopisets"]
      interval: 5s

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - app
      - fmg

volumes:
  pgdata:
  redisdata:
```

### Nginx-конфигурация

```nginx
server {
    listen 80;
    server_name letopisets.example.com;

    # Приложение (frontend + API)
    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # FMG iframe
    location /fmg/ {
        proxy_pass http://fmg:80/;
        add_header X-Frame-Options "SAMEORIGIN";
    }
}
```

### Шаги деплоя

1. Скопировать проект на сервер
2. Создать `.env` с production-значениями (безопасный `DB_PASSWORD`, реальный `ANTHROPIC_API_KEY`)
3. Запустить: `docker compose -f docker/docker-compose.yml up -d`
4. Применить миграции: `docker compose exec app pnpm db:migrate`
5. Настроить SSL через certbot / Let's Encrypt

### Оценка стоимости

| Расход | Сумма |
|--------|-------|
| VPS (Hetzner / DigitalOcean) | ~$20-40/мес |
| Claude API (100 тиков/день) | ~$30-90/мес |
| **Итого** | **~$50-130/мес** |

### Бэкапы

PostgreSQL:
```bash
# Создать бэкап
docker compose exec db pg_dump -U letopisets letopisets > backup.sql

# Восстановить
docker compose exec -T db psql -U letopisets letopisets < backup.sql
```

### Мониторинг

- Health check: `GET /health`
- Логи: `docker compose logs -f app`
- БД: `docker compose exec db psql -U letopisets`
- Redis: `docker compose exec redis redis-cli`
