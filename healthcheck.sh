#!/usr/bin/env bash
# ==============================================================================
# EAGLE AUCTIONER - PRODUCTION HEALTH CHECK VERIFICATION SCRIPT
# ==============================================================================
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-eagle-auctioner-prod-db}"
REDIS_CONTAINER="${REDIS_CONTAINER:-eagle-auctioner-prod-redis}"

# Dynamically discover active API and Frontend containers if Docker Compose is running
COMPOSE_FILE="docker-compose.prod.yml"
RESOLVED_API=""
RESOLVED_FE=""
if docker compose -f "$COMPOSE_FILE" ps >/dev/null 2>&1; then
    RESOLVED_API=$(docker compose -f "$COMPOSE_FILE" ps -q api | head -n 1 || true)
    RESOLVED_FE=$(docker compose -f "$COMPOSE_FILE" ps -q frontend | head -n 1 || true)
fi

API_CONTAINER="${API_CONTAINER:-${RESOLVED_API:-eagle-auctioner-prod-api}}"
FRONTEND_CONTAINER="${FRONTEND_CONTAINER:-${RESOLVED_FE:-eagle-auctioner-prod-frontend}}"

DB_USER="${DATABASE_USERNAME:-postgres}"
DB_NAME="${POSTGRES_DB:-eagle_auctioner}"


echo "======================================================================"
echo " Running Eagle Auctioner Production Stack Health Verification"
echo "======================================================================"

FAILURES=0

# 1. Database Health Check
echo -n "[1/5] Checking PostgreSQL Database Status... "
if docker exec "${DB_CONTAINER}" pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    echo "✓ ONLINE (pg_isready OK)"
else
    echo "✗ FAILED"
    FAILURES=$((FAILURES + 1))
fi

# 2. Redis Health Check
echo -n "[2/5] Checking Redis Memory Cache Status... "
if [ -n "${SPRING_DATA_REDIS_PASSWORD:-}" ]; then
    REDIS_PONG=$(docker exec "${REDIS_CONTAINER}" redis-cli -a "${SPRING_DATA_REDIS_PASSWORD}" ping 2>/dev/null || true)
else
    REDIS_PONG=$(docker exec "${REDIS_CONTAINER}" redis-cli ping 2>/dev/null || true)
fi

if [[ "$REDIS_PONG" == *"PONG"* ]]; then
    echo "✓ ONLINE (Redis PONG OK)"
else
    echo "✗ FAILED"
    FAILURES=$((FAILURES + 1))
fi

# 3. Backend Actuator Health Check
echo -n "[3/5] Checking Spring Boot Actuator Health Probe... "
if docker exec "${API_CONTAINER}" curl -sf http://localhost:8080/actuator/health >/dev/null 2>&1; then
    echo "✓ ONLINE (Actuator Status UP)"
else
    echo "✗ FAILED"
    FAILURES=$((FAILURES + 1))
fi

# 4. Backend Prometheus Metrics Check
echo -n "[4/5] Checking Backend Prometheus Metrics Endpoint... "
if docker exec "${API_CONTAINER}" curl -sf http://localhost:8080/actuator/prometheus >/dev/null 2>&1; then
    echo "✓ ONLINE (Prometheus Endpoint Active)"
else
    echo "✗ FAILED"
    FAILURES=$((FAILURES + 1))
fi

# 5. Frontend Nginx Health Check
echo -n "[5/5] Checking Frontend Nginx Web Server... "
if docker exec "${FRONTEND_CONTAINER}" wget -q --spider http://localhost:80/health >/dev/null 2>&1; then
    echo "✓ ONLINE (Nginx Health Route OK)"
else
    echo "✗ FAILED"
    FAILURES=$((FAILURES + 1))
fi

echo "======================================================================"
if [ "$FAILURES" -eq 0 ]; then
    echo " ALL 5 HEALTH VERIFICATION CHECKS PASSED PERFECTLY!"
    echo "======================================================================"
    exit 0
else
    echo " HEALTH VERIFICATION COMPLETED WITH ${FAILURES} FAILURE(S)!"
    echo "======================================================================"
    exit 1
fi
