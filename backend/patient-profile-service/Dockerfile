FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN --mount=type=cache,target=/root/.m2 mvn -B clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app

RUN useradd -r -u 1001 appuser

COPY --from=build /app/target/*.jar app.jar

USER appuser

ENTRYPOINT ["java", "-jar", "app.jar"]
