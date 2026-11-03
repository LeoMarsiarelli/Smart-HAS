# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN addgroup -S smarthas && adduser -S smarthas -G smarthas
COPY --from=build /app/target/backend-*.jar app.jar
USER smarthas
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
