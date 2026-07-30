# Backup & Recovery Procedure

## 1. Database Backup (PostgreSQL)

### Automated Daily Dump
```bash
pg_dump -h localhost -U eagle_user -d eagle_db -F c -b -v -f "/backups/eagle_db_$(date +%Y%m%d_%H%M%S).dump"
```

### Point-in-Time Recovery (WAL Archiving)
Ensure `wal_level = replica` and `archive_mode = on` in `postgresql.conf` for point-in-time recovery to handle transaction rollbacks or accidental data truncation.

## 2. Restore Procedure

### Standard Schema & Data Restore
```bash
pg_restore -h localhost -U eagle_user -d eagle_db -v "/backups/eagle_db_target.dump"
```

### Flyway Schema Check After Restore
Run Flyway validation after restoring database backup:
```bash
mvn flyway:validate
```
