#!/usr/bin/env bash
set -euo pipefail

cd ~/app

echo "== Preparing Docker on EC2 =="
# Start docker if not running (harmless if already active)
if ! sudo systemctl is-active --quiet docker; then
  sudo systemctl enable --now docker || true
  sudo usermod -aG docker ec2-user || true
fi

# Pick the compose command available on EC2 (v2 or legacy)
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="$(command -v docker-compose)"
else
  echo "ERROR: Docker Compose not found on EC2." >&2
  exit 1
fi

# Export vars from the .env we uploaded so compose can use them
set -a
source .env
set +a

echo "== Pulling images =="
$COMPOSE pull

echo "== Recreating stack =="
$COMPOSE down
$COMPOSE up -d

echo "== Cleanup old images =="
docker image prune -f || true

echo "== Current services =="
$COMPOSE ps

echo "✅ Deploy finished."
