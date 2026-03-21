#!/usr/bin/env bash
# Sprint 9-10 — Setup inicial para servidor Hetzner
# Ejecutar en el servidor: curl -sSL https://raw.githubusercontent.com/.../hetzner-setup.sh | bash
# O copiar y ejecutar manualmente

set -e

echo ">>> ArIA - Hetzner setup"

# Docker
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
fi

# Docker Compose
if ! command -v docker &>/dev/null; then
  sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# Directorio app
mkdir -p /opt/aria
cd /opt/aria

# Crea .env.prod (editar con valores reales)
if [ ! -f .env.prod ]; then
  cat > .env.prod << 'EOF'
# ArIA Producción - Editar valores
DB_PASSWORD=CHANGE_ME_strong_password
REDIS_PASSWORD=
CORS_ORIGINS=https://aria.actinver.com,https://www.aria.actinver.com
API_BASE_URL=https://api.aria.actinver.com
EOF
  echo ">>> Creado .env.prod - editar con valores reales"
fi

echo ">>> Setup completado. Siguiente: configurar .env.prod y deploy"
