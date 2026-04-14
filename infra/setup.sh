#!/bin/bash
set -e

echo "=== Estate AI Platform — Setup ==="

# 1. Создаём .env если нет
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ .env создан из .env.example — заполни OPENAI_API_KEY и POSTGRES_PASSWORD"
fi

# 2. Создаём базу n8n отдельно (n8n не создаёт её сам)
echo "→ Запускаем postgres..."
docker compose up -d postgres
sleep 3

docker compose exec postgres psql -U postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname='n8n_db'" | grep -q 1 || \
  docker compose exec postgres psql -U postgres -c "CREATE DATABASE n8n_db;"

echo "✓ База n8n_db создана"

# 3. Поднимаем весь стек
echo "→ Запускаем все сервисы..."
docker compose up -d

echo ""
echo "=== Готово! ==="
echo ""
echo "  Frontend   → http://localhost:3000"
echo "  API        → http://localhost:4000"
echo "  Swagger    → http://localhost:4000/api/docs"
echo "  n8n        → http://localhost:5678"
echo ""
echo "=== n8n: импорт workflows ==="
echo "  1. Открой http://localhost:5678"
echo "  2. Settings → Import workflow"
echo "  3. Импортируй файлы из ./n8n-workflows/*.json"
echo "  4. Добавь credentials: Telegram Bot + OpenAI API"
echo "  5. Задай Variables: TELEGRAM_CHAT_ID, CRM_URL"
