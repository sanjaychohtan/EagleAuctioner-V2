#!/usr/bin/env bash
# ==============================================================================
# EAGLE AUCTIONER - PRODUCTION ROLLBACK SCRIPT
# ==============================================================================
set -euo pipefail

ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"

echo "======================================================================"
echo " Starting Eagle Auctioner Rollback Procedure"
echo "======================================================================"

PREV_TAG="${1:-previous}"

echo "[1/4] Stopping current deployment containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo "[2/4] Reverting to image version / commit tag: ${PREV_TAG}..."
if git rev-parse --verify "$PREV_TAG" >/dev/null 2>&1; then
    echo "Checking out git tag/commit: $PREV_TAG"
    git checkout "$PREV_TAG"
else
    echo "Warning: Tag $PREV_TAG not found in git log. Rebuilding from previous git commit (HEAD~1)..."
    git checkout HEAD~1
fi

echo "[3/4] Rebuilding and starting previous release stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo "[4/4] Verifying health after rollback..."
sleep 15
if [ -f "./scripts/healthcheck.sh" ]; then
    ./scripts/healthcheck.sh
fi

echo "======================================================================"
echo " Rollback Procedure Successfully Executed!"
echo "======================================================================"
