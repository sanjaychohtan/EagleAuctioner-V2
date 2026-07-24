# Stage 1: Build Java artifact
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy dependency manifest & pre-fetch dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source & package JAR
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Production Execution Image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Create non-root application group and user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Create upload directory with proper permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy compiled JAR artifact
COPY --from=build /app/target/*.jar app.jar
RUN chown appuser:appgroup /app/app.jar

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
