# Eagle Auctioner — Production Deployment Guide

## Overview

This guide provides step-by-step procedures for deploying the **Eagle Auctioner Enterprise Platform** into a production VPS environment using Docker Compose, Nginx, PostgreSQL 16, and Redis 7.

---

## 1. Prerequisites

- **Operating System**: Ubuntu 22.04 LTS or Debian 12 recommended.
- **System Specs**: Minimum 4 CPU Cores, 8 GB RAM, 50 GB SSD.
- **Software Installed**:
  - Docker Engine `24.0+`
  - Docker Compose `v2.20+`
  - Git
  - OpenSSL

---

## 2. Server Provisioning & Pre-flight Steps

```bash
# 1. Clone the repository
git clone https://github.com/eagle-auctioner/v1.git /opt/eagle-auctioner
cd /opt/eagle-auctioner

# 2. Prepare production environment file
cp .env.production.example .env.production

# 3. Edit .env.production with secure credentials
nano .env.production
```

### Essential Environment Variables to Update in `.env.production`

- `POSTGRES_PASSWORD`: Strong database password.
- `SPRING_DATA_REDIS_PASSWORD`: Strong Redis password.
- `JWT_SECRET_KEY`: Base64-encoded 256-bit secret key.
- `APPLICATION_CORS_ALLOWED_ORIGINS`: Domains (e.g. `https://app.eagleauctioner.com`).

---

## 3. SSL / TLS Certificate Setup (Let's Encrypt / Certbot)

```bash
# Create SSL directory structure
mkdir -p /etc/nginx/ssl

# Obtain certificates using certbot standalone mode
sudo apt update && sudo apt install -y certbot
sudo certbot certonly --standalone -d app.eagleauctioner.com -d admin.eagleauctioner.com

# Copy or link certificates to Nginx target path
cp /etc/letsencrypt/live/app.eagleauctioner.com/fullchain.pem /etc/nginx/ssl/fullchain.pem
cp /etc/letsencrypt/live/app.eagleauctioner.com/privkey.pem /etc/nginx/ssl/privkey.pem
```

---

## 4. Execution of Deployment

Run the automated deployment script:

```bash
chmod +x deploy.sh healthcheck.sh rollback.sh backup.sh restore.sh
./deploy.sh
```

### Verification Commands

```bash
# Check container statuses
docker compose -f docker-compose.prod.yml ps

# Execute comprehensive health check
./healthcheck.sh
```

---

## 5. Domain & Network Routing

Ensure host firewall permits inbound traffic on:
- **Port 80 (HTTP)**: Redirects automatically to HTTPS.
- **Port 443 (HTTPS)**: Primary encrypted entry point.

---

## 6. Maintenance & Operational Monitoring

- Logs can be inspected via `docker compose -f docker-compose.prod.yml logs -f [service]`.
- Prometheus metrics are available at `http://localhost:8080/actuator/prometheus` (internal).
