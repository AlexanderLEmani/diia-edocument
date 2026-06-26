#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker не встановлено. Встановіть Docker на Ubuntu:"
  echo "  curl -fsSL https://get.docker.com | sh"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "Docker Compose не знайдено."
  exit 1
fi

$COMPOSE up -d --build

echo
echo "Дія запущена: http://$(hostname -I 2>/dev/null | awk '{print $1}'):8080"
echo "PIN для входу: 1245"
echo
echo "Команди:"
echo "  $COMPOSE logs -f    # логи"
echo "  $COMPOSE down       # зупинити"
