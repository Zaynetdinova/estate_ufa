#!/bin/sh
# Ждём пока n8n запустится
echo "Waiting for n8n to be ready..."
until curl -sf -u "${N8N_USER:-admin}:${N8N_PASSWORD:-changeme}" \
  http://n8n:5678/healthz > /dev/null 2>&1; do
  sleep 3
done
echo "n8n is ready. Importing and activating workflows..."

# Получаем список всех workflows через API
WORKFLOWS=$(curl -sf \
  -u "${N8N_USER:-admin}:${N8N_PASSWORD:-changeme}" \
  http://n8n:5678/api/v1/workflows)

# Активируем каждый workflow
echo "$WORKFLOWS" | grep -o '"id":"[^"]*"' | sed 's/"id":"//;s/"//' | while read id; do
  echo "Activating workflow: $id"
  curl -sf -X PATCH \
    -u "${N8N_USER:-admin}:${N8N_PASSWORD:-changeme}" \
    -H "Content-Type: application/json" \
    -d '{"active":true}' \
    "http://n8n:5678/api/v1/workflows/$id" > /dev/null
done

echo "All workflows activated!"
