#!/usr/bin/env bash
# Automated PostgreSQL Backup Script for Eagle Auctioner
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER_NAME="${CONTAINER_NAME:-eagle-auctioner-prod-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-eagleauctioner}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/eagleauctioner_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting PostgreSQL database backup..."
docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}"

# Cleanup backups older than RETENTION_DAYS
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "eagleauctioner_backup_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "[$(date)] Backup maintenance completed."
