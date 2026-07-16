# Eagle Auctioner Backend (Spring Boot)

This is the production-grade Java backend for the Eagle Auctioner platform, migrated from the original TypeScript specification.

## Tech Stack
- **Framework**: Spring Boot 3.2.5
- **Java**: 17
- **Database**: PostgreSQL 16
- **Migration**: Flyway
- **Build Tool**: Maven

## Getting Started

### Prerequisites
- JDK 17+
- Docker & Docker Compose (optional, for local DB)

### Running Locally with Docker
```bash
docker-compose up -d
```

### Running with Maven
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

## Project Structure
- `src/main/java`: Java source code (Entities, Repositories, Services, Controllers to be populated)
- `src/main/resources`: Configuration and DB migrations
- `Dockerfile`: Multi-stage build for production deployment
- `docker-compose.yml`: Local orchestration for DB and API
