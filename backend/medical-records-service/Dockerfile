<<<<<<< HEAD
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app
=======
# ---- Build ----
FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build
>>>>>>> origin/main
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B clean package -DskipTests

<<<<<<< HEAD
FROM eclipse-temurin:25-jre
=======
# ---- Runtime ----
FROM eclipse-temurin:25-jre-alpine
RUN addgroup -S app && adduser -S app -G app
>>>>>>> origin/main
WORKDIR /app
COPY --from=build /build/target/medical-records-service-*.jar app.jar
USER app
EXPOSE 8086
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
