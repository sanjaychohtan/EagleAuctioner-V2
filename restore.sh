#!/usr/bin/env bash
# ==============================================================================
# EAGLE AUCTIONER - PRODUCTION DATABASE RESTORE SCRIPT
# ==============================================================================
set -euo pipefail

DB_CONTAINER="${DB_CONTAINER:-eagle-auctioner-prod-db}"
DB_USER="${DATABASE_USERNAME:-postgres}"
DB_NAME="${POSTGRES_DB:-eagle_auctioner}"

if [ -z "${1:-}" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    echo "Available backups in ./backups:"
    ls -lh ./backups/*.sql.gz 2>/dev/null || echo "No backup files found."
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file '$BACKUP_FILE' does not exist."
    exit 1
fi

echo "======================================================================"
echo " WARNING: THIS WILL OVERWRITE DATA IN DATABASE: ${DB_NAME}"
echo "======================================================================"
read -p "Are you sure you want to proceed with restore? (y/N): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Restore cancelled by user."
    exit 0
fi

echo "[1/2] Terminating active backend database connections..."
docker exec -t "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();" || true

echo "[2/2] Restoring PostgreSQL database from ${BACKUP_FILE}..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "======================================================================"
echo " Database Restore Successfully Completed!"
echo "======================================================================"
