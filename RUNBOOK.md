# Eagle Auctioner — Production Operations Runbook

## System Architecture Overview

Eagle Auctioner is deployed via a multi-container Docker topology on `eagle_network`:

1. **Frontend (`eagle-auctioner-prod-frontend`)**: Nginx reverse proxy serving static React assets, offloading TLS, proxying `/api/` REST and `/ws` WebSockets.
2. **Backend API (`eagle-auctioner-prod-api`)**: Spring Boot 3.2 Java 17 application running as non-root user `appuser`.
3. **Database (`eagle-auctioner-prod-db`)**: PostgreSQL 16.2 with persistent volume `postgres_prod_data`.
4. **Cache (`eagle-auctioner-prod-redis`)**: Redis 7.2.4 with persistent volume `redis_prod_data`.

---

## Daily Operational Commands

### 1. Stack Status Inspection
```bash
docker compose -f docker-compose.prod.yml ps
```

### 2. View Service Logs
```bash
# View backend application logs
docker compose -f docker-compose.prod.yml logs -f api

# View Nginx access & error logs
docker compose -f docker-compose.prod.yml logs -f frontend

# View PostgreSQL database logs
docker compose -f docker-compose.prod.yml logs -f db
```

### 3. Restarting Services
```bash
# Restart single service without downtime on others
docker compose -f docker-compose.prod.yml restart api
```

---

## Incident Response Procedures

### Incident 1: High CPU / Memory Usage on Backend
1. Inspect thread dump / metrics:
   ```bash
   docker exec -it eagle-auctioner-prod-api curl http://localhost:8080/actuator/metrics/jvm.threads.live
   ```
2. Restart container gracefully (30-second shutdown phase configured):
   ```bash
   docker compose -f docker-compose.prod.yml restart api
   ```

### Incident 2: Database Connection Pool Exhaustion (HikariCP)
1. Check active database connections:
   ```bash
   docker exec -it eagle-auctioner-prod-db psql -U postgres -d eagle_auctioner -c "SELECT count(*) FROM pg_stat_activity;"
   ```
2. If pool limit is saturated, adjust `HIKARI_MAX_POOL_SIZE` in `.env.production` and restart API.

### Incident 3: WebSockets Disconnections
1. Check Nginx WebSocket proxy timeout configuration in `nginx.conf`:
   - `proxy_read_timeout 86400s;`
   - `proxy_send_timeout 86400s;`
2. Test connection endpoint `/ws`.

---

## Log Management & Rotation

- Container logs are handled by `json-file` driver with `10m` max size and 3 file rotation limit.
- Spring Boot writes application logs per `logback-spring.xml`.
