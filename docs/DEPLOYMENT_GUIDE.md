# Enterprise Deployment Guide

## 1. Prerequisites
* **JDK**: OpenJDK 21 or Java 21 LTS
* **Node.js**: Node.js 18+ and npm 9+
* **Database**: PostgreSQL 15+
* **Cache**: Redis 7+ (Single instance or Redis Cluster)
* **Build Tool**: Apache Maven 3.8+

## 2. Environment Variables

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Yes | Spring profile (`dev`, `prod`) | `prod` |
| `SPRING_DATASOURCE_URL` | Yes | JDBC PostgreSQL URL | `jdbc:postgresql://postgres:5432/eagle_db` |
| `SPRING_DATASOURCE_USERNAME` | Yes | Database username | `eagle_user` |
| `SPRING_DATASOURCE_PASSWORD` | Yes | Database password | `StrongSecretPass123!` |
| `SPRING_REDIS_HOST` | Yes | Redis host | `redis` |
| `SPRING_REDIS_PORT` | Yes | Redis port | `6379` |
| `JWT_SECRET_KEY` | Yes | Base64 HMAC SHA-256 JWT secret key | `super_secret_jwt_key_at_least_256_bits_long!` |

## 3. Build & Deployment Steps

### Backend Build (Maven)
```bash
cd backend
mvn clean package -DskipTests
java -jar target/eagle-auctioner-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### Frontend Build (Vite)
```bash
npm install
npm run build
# Serve static dist directory via Nginx or Spring Boot static handler
```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
