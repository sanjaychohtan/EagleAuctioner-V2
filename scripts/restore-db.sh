#!/usr/bin/env bash
# PostgreSQL Restore Script for Eagle Auctioner
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="${CONTAINER_NAME:-eagle-auctioner-prod-db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-eagleauctioner}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[$(date)] Restoring PostgreSQL database from ${BACKUP_FILE}..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "[$(date)] Database restoration completed successfully."
