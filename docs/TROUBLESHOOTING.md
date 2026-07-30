# Troubleshooting Guide

## Common Issues & Solutions

### 1. `FlywayValidateException`: Validate failed: Migrations have changed
* **Cause**: Modification of an already applied migration SQL file changes its checksum.
* **Fix**: Do not edit past migration files (`V1` through `V4`). Add new incremental migration files (`V5`, `V6`, `V7`, `V8`).

### 2. WebSocket Connection Rejection (`401 Unauthorized`)
* **Cause**: Missing or invalid JWT authorization token in STOMP headers during socket connection.
* **Fix**: Include `Authorization: Bearer <TOKEN>` in the STOMP connect headers (`connectHeaders`).

### 3. `DataScopeType` Compilation Error
* **Cause**: Attempting to use non-existent scope constant (e.g. `DataScopeType.USER`).
* **Fix**: Use standard enum constant `DataScopeType.BUYER` for bidder/user scopes.
