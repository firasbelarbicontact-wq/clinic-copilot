# Clinic Copilot — Administration Service

Microservice Spring Boot (Java 17, port **8087**) porté par **M6**.
Il gère la configuration de la plateforme, les statistiques agrégées du tableau de bord et les
actions réservées aux administrateurs (activation/désactivation de comptes, validation des médecins).

> Ce service **ne possède ni les comptes utilisateurs ni les profils médecins** : il appelle Identity Service
> et Doctor Directory Service par REST, puis journalise chaque action dans **Audit Service** (SUCCESS / FAILURE).
> Il est totalement indépendant d'Audit Service (code, base, conteneur).
> **Aucune donnée clinique** (symptômes, diagnostics, messages de chat) ne doit transiter ici.

## Architecture

```
controller → service → repository → PostgreSQL (administration_db, propre à ce service)
                 └──→ client (REST) → Identity Service / Doctor Directory Service / Audit Service
```

Packages : `controller`, `service`, `repository`, `entity`, `dto`, `config`, `client`, `exception`.

## Endpoints

| Méthode | Chemin | Accès |
|---|---|---|
| GET | `/api/v1/configurations` , `/{key}` | ADMIN |
| PUT | `/api/v1/configurations/{key}` (upsert) | ADMIN |
| DELETE | `/api/v1/configurations/{key}` | ADMIN |
| GET | `/api/v1/dashboard/snapshots?metricType=&from=&to=&page=&size=` | ADMIN |
| POST | `/api/v1/dashboard/snapshots` | ADMIN ou service interne |
| PATCH | `/api/v1/admin/users/{userId}/status` | ADMIN |
| PATCH | `/api/v1/admin/doctors/{doctorId}/verification` | ADMIN |

Documentation : `openapi.yaml` (à la racine) et Swagger UI sur `http://localhost:8087/swagger-ui.html`.

## Sécurité

- **JWT HS256** (`Authorization: Bearer ...`) : secret `JWT_SECRET`, claim `sub` = UUID de l'acteur, claim `role` = rôle (`ADMIN`).
- **Clé API interne** : en-tête `X-Internal-Api-Key`, valeur `INTERNAL_API_KEY` (appels entrants service-à-service, et envoyée sur les appels sortants).
- Valeurs par défaut de développement (marquées `CHANGE_ME_DEV_ONLY`) : **à changer en production**.

## Lancer

### Docker (recommandé)
```bash
docker compose up --build
```
Service : http://localhost:8087 — PostgreSQL exposé sur le port hôte **5437** (base `administration_db`).
Le réseau Docker `clinic-copilot-net` est partagé : déclarez le même `name` dans les compose des autres services
pour qu'ils se joignent par nom DNS (`audit-service`, `identity-service`, ...).

### Local (IntelliJ / Eclipse / VS Code)
1. Lancer une base : `docker compose up -d administration-db`
2. Lancer `AdministrationServiceApplication` (ou `mvn spring-boot:run`).

Variables : `DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `INTERNAL_API_KEY`, `IDENTITY_SERVICE_URL`,
`DOCTOR_DIRECTORY_SERVICE_URL`, `AUDIT_SERVICE_URL`, `CLIENT_TIMEOUT_MS`.

## Tester

```bash
mvn test
```
`AdminOrchestrationServiceTest` vérifie : appel du service externe **puis** journalisation (SUCCESS), journalisation FAILURE
avec re-propagation de l'erreur, absence de fuite du motif libre dans l'audit, et qu'un échec d'Audit ne masque pas l'action.

Test manuel (générer un JWT HS256 avec `sub` = UUID et `role` = `ADMIN`, par exemple sur jwt.io, avec le même secret) :
```bash
curl -X PUT http://localhost:8087/api/v1/configurations/maintenance.mode \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"value":"false","description":"Mode maintenance"}'

curl -X POST http://localhost:8087/api/v1/dashboard/snapshots \
  -H "X-Internal-Api-Key: CHANGE_ME_DEV_ONLY_internal_api_key" -H "Content-Type: application/json" \
  -d '{"metricType":"TOTAL_USERS","periodStart":"2026-11-01T00:00:00Z","periodEnd":"2026-11-07T23:59:59Z","value":128}'
```

## Comportement d'orchestration

1. Appel du service propriétaire (Identity / Doctor Directory).
2. Journalisation dans Audit Service : `SUCCESS` si l'appel a réussi, `FAILURE` sinon (l'erreur est ensuite renvoyée : 404 si la ressource n'existe pas en amont, 502 sinon).
3. Si Audit Service est indisponible, l'erreur est **loggée** mais ne masque pas le résultat de l'action (best effort).
   → À valider avec l'équipe : faut-il plutôt faire échouer l'action si l'audit est impossible, ou prévoir un mécanisme de reprise (outbox / RabbitMQ) ?

Métadonnées d'audit : uniquement `newStatus`, `failedService`, `upstreamStatus` — jamais de texte libre ni de contenu clinique.

## Points à confirmer avec l'équipe

| Avec | Point |
|---|---|
| **M1** (Identity Service) | Chemin, corps et valeurs d'enum de `PATCH /api/v1/users/{userId}/status` (hypothèse : `{"status":"ACTIVE\|DISABLED"}`) ; port ; accepte-t-il `X-Internal-Api-Key` ? |
| **M2** (Doctor / Directory) | Quel service porte la vérification (Doctor Service ou Directory Service ?) ; chemin et corps de `PATCH /api/v1/doctors/{doctorId}/verification` (hypothèse : `{"status":"VERIFIED\|REJECTED","reason":"..."}`) ; port |
| **M6** (Audit, vous) | Actions `DOCTOR_REJECTED` et `ACCOUNT_STATUS_CHANGED` acceptées telles quelles (champ `action` en chaîne libre) |
| **Équipe / Gateway** | Routage `/api/v1/admin/**`, `/api/v1/configurations/**`, `/api/v1/dashboard/**` ; le JWT émis par Identity doit contenir `sub` (UUID) et `role` |
| **Encadrant** | Services réellement indépendants (repos/bases/conteneurs) — conforme à ce projet |

Tous les endroits concernés sont marqués `TODO` dans `IdentityServiceClient` et `DoctorDirectoryClient`.
Les ports 8081 / 8083 utilisés par défaut sont des **suppositions**.

## Limites connues
- `ddl-auto: update` en développement ; prévoir Flyway/Liquibase pour la production.
- Les statistiques sont **poussées** vers ce service (POST) ; il ne les calcule pas lui-même.

## Outils de test (dossier `scripts/`)
- `python scripts/gen_jwt.py` : génère un JWT ADMIN de test (`--role PATIENT` pour tester le 403).
- `python scripts/mock_services.py` : simule Identity (8081), Doctor Directory (8083) et Audit (8086) et affiche les requêtes reçues.
  UUID commençant par `00000000` → le mock répond 404 ; par `99999999` → 500.

## Test rapide avec Docker (Windows / macOS)
```
copy .env.example .env            (Windows)   |  cp .env.example .env   (macOS/Linux)
python scripts\mock_services.py                (terminal 1)
docker compose up --build                      (terminal 2)
python scripts\smoke_test.py                   (terminal 3)  -> tous les contrôles doivent être OK
```
Sous Linux, ajouter `extra_hosts: ["host.docker.internal:host-gateway"]` au service `administration-service`.
