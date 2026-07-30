# Eagle Auctioner — Production Rollback Guide

## Purpose & Scope

This guide outlines the standard operating procedure for rolling back an unhealthy or failed production release of Eagle Auctioner to a known stable release.

---

## 1. Fast Automated Rollback

If a newly deployed release fails health checks or encounters critical production errors, execute `./rollback.sh`:

```bash
# Rollback to specific git tag or previous commit
./rollback.sh v1.0.0
```

If no tag is provided, `./rollback.sh` defaults to reverting to `HEAD~1`.

---

## 2. Step-by-Step Manual Rollback Procedure

### Step 1: Stop Current Container Stack
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production down
```

### Step 2: Revert Repository Code & Tag
```bash
git checkout <LAST_KNOWN_STABLE_COMMIT_OR_TAG>
```

### Step 3: Rebuild Container Images
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache
```

### Step 4: Launch Previous Release Stack
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### Step 5: Execute Health Verification
```bash
./healthcheck.sh
```

---

## 3. Database Migration Rollback Strategy (Flyway)

Eagle Auctioner utilizes Flyway schema versioning.
If a release includes backwards-incompatible database schema changes:
1. Restore database snapshot prior to deployment using `./restore.sh <pre_deploy_backup.sql.gz>`.
2. Start the reverted backend release.
