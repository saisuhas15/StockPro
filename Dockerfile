# Build with a clean Maven/JDK image so no stale local .class files are reused.
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -U clean package -DskipTests

# Run the packaged Spring Boot application.
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/stockpro-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
