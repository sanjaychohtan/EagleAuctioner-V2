# Operations Runbook

## 1. System Health Monitoring
* **Health Check Endpoint**: `GET /actuator/health`
* **Prometheus Metrics**: `GET /actuator/prometheus`
* **Log Files**: `backend/logs/eagle-auctioner.log` (Managed by Logback)

## 2. Common Operational Tasks

### Restart Application Service
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### Invalidate Dashboard Analytics Cache
Execute REST API call or run via Admin Operations Console:
```bash
curl -X POST http://localhost:3000/api/v1/analytics/dashboard/invalidate-cache \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

### Monitor Redis Locks & WebSocket Connections
Inspect active Redisson auction locks:
```bash
redis-cli -h localhost -p 6379 KEYS "auction:*"
```
