#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${SOJ_BACKEND_DIR:-$ROOT_DIR/../SOJ}"
COMPOSE_FILE="$BACKEND_DIR/deploy/docker-compose.yaml"
REUSE_BACKEND="${SOJ_HTTP_REUSE_BACKEND:-0}"

if [[ "$REUSE_BACKEND" != "1" ]]; then
  trap 'docker compose -f "$COMPOSE_FILE" down -v --remove-orphans' EXIT
  docker compose -f "$COMPOSE_FILE" down -v --remove-orphans
  docker compose -f "$COMPOSE_FILE" up --build -d
fi

for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8080/readyz >/dev/null; then
    break
  fi
  sleep 1
done
curl -fsS http://127.0.0.1:8080/readyz >/dev/null

cd "$ROOT_DIR"
npx playwright test -c playwright.http.config.ts
