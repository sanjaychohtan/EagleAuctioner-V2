#!/usr/bin/env bash
# ==============================================================================
# EAGLE AUCTIONER - PRODUCTION DEPLOYMENT SCRIPT
# ==============================================================================
set -euo pipefail

ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"

echo "======================================================================"
echo " Starting Eagle Auctioner Production Deployment"
echo "======================================================================"

# 1. Check prerequisites
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: Production environment file '$ENV_FILE' not found!"
    echo "Please create '$ENV_FILE' from '.env.production.example' before deploying."
    exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: Docker compose file '$COMPOSE_FILE' not found!"
    exit 1
fi

# 2. Pull external images
echo "[1/4] Pulling base container images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull --quiet db redis || true

# 3. Build application containers
echo "[2/4] Building production service containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel

# 4. Spin up production stack
echo "[3/4] Starting production stack in detached mode..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

# 5. Run health verification
echo "[4/4] Verifying production deployment health..."
if [ -f "./scripts/healthcheck.sh" ]; then
    ./scripts/healthcheck.sh
elif [ -f "./healthcheck.sh" ]; then
    ./healthcheck.sh
else
    echo "Waiting for services to settle..."
    sleep 15
    docker compose -f "$COMPOSE_FILE" ps
fi

echo "======================================================================"
echo " Deployment Successfully Completed!"
echo "======================================================================"
