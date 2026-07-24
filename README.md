# Eagle Auctioner — Enterprise B2B Auction Platform

[![Enterprise CI Pipeline](https://github.com/eagle-auctioner/v1/actions/workflows/ci.yml/badge.svg)](https://github.com/eagle-auctioner/v1/actions/workflows/ci.yml)
[![Enterprise CD Pipeline](https://github.com/eagle-auctioner/v1/actions/workflows/cd.yml/badge.svg)](https://github.com/eagle-auctioner/v1/actions/workflows/cd.yml)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-blue.svg)](https://www.typescriptlang.org/)
[![Spring Boot 3.2](https://img.shields.io/badge/Spring%20Boot-3.2-green.svg)](https://spring.io/projects/spring-boot)
[![Docker Ready](https://img.shields.io/badge/Docker-Multi--Stage-blue.svg)](https://www.docker.com/)
[![License: Enterprise](https://img.shields.io/badge/License-Proprietary-red.svg)](#)

---

## Executive Overview

**Eagle Auctioner** is an enterprise-grade B2B auctioning and reverse-auctioning platform supporting live bidding streams, sealed bid auctions, dual-sign maker-checker compliance workflows, real-time STOMP WebSockets, automated settlement generation, and double-entry financial ledgers.

---

## Quick Start (Development)

### Frontend
```bash
# Install dependencies
npm ci

# Run development server
npm run dev

# Run TypeScript typecheck
npx tsc --noEmit

# Compile production bundle
npm run build
```

### Backend
```bash
# Run Spring Boot test suite
cd backend
mvn test

# Package Spring Boot JAR
mvn package -DskipTests
```

---

## Production Deployment (Docker Compose)

```bash
# Spin up complete production stack (Postgres 16, Redis 7, Backend API, Frontend Nginx)
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## Key Documentation

- [PRODUCTION_RELEASE_BOOK.md](PRODUCTION_RELEASE_BOOK.md): SRE operations runbook, database migration path, HikariCP connection pool specs, and health check probes.
- [CI_CD_PLAYBOOK.md](CI_CD_PLAYBOOK.md): GitHub Actions CI/CD workflows, quality gates matrix, container registry policies, and rollback manual.
