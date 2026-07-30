#!/usr/bin/env bash
# ==============================================================================
# EAGLE AUCTIONER - PRODUCTION BACKUP SCRIPT (POSTGRESQL + REDIS)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

DB_CONTAINER="${DB_CONTAINER:-eagle-auctioner-prod-db}"
REDIS_CONTAINER="${REDIS_CONTAINER:-eagle-auctioner-prod-redis}"

DB_USER="${DATABASE_USERNAME:-postgres}"
DB_NAME="${POSTGRES_DB:-eagle_auctioner}"

mkdir -p "${BACKUP_DIR}"

echo "======================================================================"
echo " Starting Eagle Auctioner Production Backup: ${TIMESTAMP}"
echo "======================================================================"

# 1. PostgreSQL Backup
echo "[1/3] Executing PostgreSQL Database Dump..."
PG_BACKUP_FILE="${BACKUP_DIR}/postgres_${DB_NAME}_${TIMESTAMP}.sql.gz"
docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${PG_BACKUP_FILE}"
echo "  ↳ PostgreSQL backup created: ${PG_BACKUP_FILE} ($(du -h "${PG_BACKUP_FILE}" | cut -f1))"

# 2. Redis RDB Backup
echo "[2/3] Executing Redis Memory Snapshot (SAVE)..."
REDIS_BACKUP_FILE="${BACKUP_DIR}/redis_dump_${TIMESTAMP}.rdb"
if [ -n "${SPRING_DATA_REDIS_PASSWORD:-}" ]; then
    docker exec -t "${REDIS_CONTAINER}" redis-cli -a "${SPRING_DATA_REDIS_PASSWORD}" save > /dev/null 2>&1 || true
else
    docker exec -t "${REDIS_CONTAINER}" redis-cli save > /dev/null 2>&1 || true
fi
docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${REDIS_BACKUP_FILE}" || true
if [ -f "${REDIS_BACKUP_FILE}" ]; then
    echo "  ↳ Redis backup created: ${REDIS_BACKUP_FILE} ($(du -h "${REDIS_BACKUP_FILE}" | cut -f1))"
else
    echo "  ↳ Warning: Redis dump.rdb snapshot could not be copied."
fi

# 3. Retention Cleanup
echo "[3/3] Performing Retention Cleanup (Removing backups older than ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -type f \( -name "*.sql.gz" -o -name "*.rdb" \) -mtime +"${RETENTION_DAYS}" -delete
echo "Retention cleanup completed."

echo "======================================================================"
echo " Backup Completed Successfully!"
echo "======================================================================"
