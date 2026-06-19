#!/usr/bin/env sh
set -eu

docker compose build

if [ "${1:-}" != "--build-only" ]; then
  docker compose up -d
  docker compose ps
  printf '%s\n' "Frontend: http://localhost:5173"
  printf '%s\n' "Backend health: http://localhost:8000/health"
fi
