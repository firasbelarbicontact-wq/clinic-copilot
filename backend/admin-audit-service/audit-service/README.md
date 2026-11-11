# Audit Service

Enregistre les actions importantes de la plateforme (qui, quoi, sur quoi, quand, résultat).
Aucune donnée clinique n'est stockée.

## Port
8086

## Lancer
cp .env.example .env
docker compose up --build

## Endpoints
- POST /api/v1/audit-logs : écrire un log (clé API interne)
- GET /api/v1/audit-logs : rechercher (ADMIN, JWT)
- GET /api/v1/audit-logs/{id} : lire un log (ADMIN, JWT)
- Santé : GET /actuator/health
- Swagger : http://localhost:8086/swagger-ui.html

## Variables d'environnement
DB_USERNAME, DB_PASSWORD, JWT_SECRET, INTERNAL_API_KEY

