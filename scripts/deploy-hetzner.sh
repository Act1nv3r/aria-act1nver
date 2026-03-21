#!/usr/bin/env bash
# Sprint 9-10 — Script de deploy para Hetzner
# Uso: ./scripts/deploy-hetzner.sh [staging|production]
# Requiere: SSH key configurado, servidor con Docker

set -e

ENV="${1:-staging}"
REMOTE_USER="${DEPLOY_USER:-root}"
REMOTE_HOST="${DEPLOY_HOST:?Set DEPLOY_HOST}"
REMOTE_DIR="${DEPLOY_DIR:-/opt/aria}"

echo ">>> Deploy ArIA ($ENV) -> $REMOTE_USER@$REMOTE_HOST"

# Build frontend local (opcional)
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo ">>> Building frontend..."
  npm ci
  npm run build
fi

# Sync y deploy
echo ">>> Syncing..."
rsync -avz --exclude node_modules --exclude .next --exclude '*.git' \
  . "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

echo ">>> Deploying on server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "cd $REMOTE_DIR && \
  docker compose -f docker-compose.prod.yml build --no-cache api && \
  docker compose -f docker-compose.prod.yml up -d"

echo ">>> Deploy ArIA ($ENV) completado"
