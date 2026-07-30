# Eagle Auctioner — Backup & Recovery Guide

## Strategy & Policy

- **RPO (Recovery Point Objective)**: 1 Hour (hourly automated snapshots).
- **RTO (Recovery Time Objective)**: 15 Minutes.
- **Retention Period**: 7 Days (configurable via `RETENTION_DAYS`).

---

## 1. Automated Backup Execution

Backups are handled by the automated script `./backup.sh`:

```bash
# Execute immediate full backup (PostgreSQL + Redis + Retention Cleanup)
./backup.sh
```

### Automating via Cron Job

Add the following line to the host system crontab (`crontab -e`) to execute backups daily at 02:00 AM UTC:

```cron
0 2 * * * cd /opt/eagle-auctioner && ./backup.sh >> /var/log/eagle-backup.log 2>&1
```

---

## 2. Backup Output Artifacts

Backups are saved to `./backups/` directory:

1. `postgres_eagle_auctioner_YYYYMMDD_HHMMSS.sql.gz`: Compressed SQL dump of PostgreSQL data.
2. `redis_dump_YYYYMMDD_HHMMSS.rdb`: Binary snapshot of Redis keyspace and WebSocket session states.

---

## 3. Disaster Recovery / Database Restoration

To restore a specific database backup file:

```bash
# Execute database restore script
./restore.sh ./backups/postgres_eagle_auctioner_YYYYMMDD_HHMMSS.sql.gz
```

### Manual Disaster Recovery Steps

If restoring on a fresh VPS host:

1. Copy backup archive to host.
2. Spin up database container:
   ```bash
   docker compose -f docker-compose.prod.yml up -d db
   ```
3. Restore database schema & data:
   ```bash
   gunzip -c postgres_backup.sql.gz | docker exec -i eagle-auctioner-prod-db psql -U postgres -d eagle_auctioner
   ```
4. Start complete application stack:
   ```bash
   ./deploy.sh
   ```
