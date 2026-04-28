#!/usr/bin/env bash
# Stop any prior instance, then bring up the full stack.
set -euo pipefail

cd "$(dirname "$0")/.."

# 1. Verify Docker daemon (wait up to 60s if mid-boot)
if ! docker ps >/dev/null 2>&1; then
  echo "▶ Docker daemon not responding — trying to launch Docker Desktop…"
  open -a Docker 2>/dev/null || true
  for i in {1..30}; do
    sleep 2
    docker ps >/dev/null 2>&1 && break
  done
  if ! docker ps >/dev/null 2>&1; then
    echo "✖ Docker daemon still not responding after 60s. Open Docker Desktop manually and retry."
    exit 1
  fi
  echo "✓ Docker daemon ready"
fi

# 2. Free port 3000
echo "▶ Stopping anything on :3000…"
if lsof -ti:3000 >/dev/null 2>&1; then
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

# 3. Stop & remove existing compose stack (incl. orphans)
echo "▶ Stopping existing docker compose stack…"
docker compose down --remove-orphans 2>/dev/null || true

# 4. Force-remove any leftover containers from a previous run that crashed
for name in testgov-app-1 testgov-postgres-1; do
  if docker ps -aq --filter "name=^${name}$" | grep -q .; then
    echo "▶ Removing leftover container ${name}…"
    docker rm -f "${name}" >/dev/null 2>&1 || true
  fi
done

# 5. Ensure .env exists
if [ ! -f .env ]; then
  echo "▶ Creating .env from .env.example…"
  cp .env.example .env
fi

# 6. Up
echo "▶ Building & starting…"
exec docker compose up --build
