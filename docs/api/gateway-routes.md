# API Gateway : routes

La gateway est le point d'entrée unique du backend. Angular et Android n'appellent qu'elle ; 
elle redirige chaque requête vers le bon service **sans modifier le chemin**.

- Code : `backend/api-gateway`
- Configuration des routes : `backend/api-gateway/src/main/resources/application.yml`
- URL en local (Docker) : `http://localhost:8090` (port interne 8080)
- Santé : `GET /actuator/health` · routes chargées : `GET /actuator/gateway/routes`

## Routes

Les routes sont évaluées dans l'ordre : les plus spécifiques passent avant les plus générales.

| Ordre | Chemins | Service | Port interne | Variable Docker |
|---|---|---|---|---|
| 1 | `/api/auth/**`, `/api/users/**` | identity-profile-service | 8081 | `IDENTITY_URL` |
| 2 | `/api/patient-profiles/**` | patient-profile-service | 8090 | `PATIENT_URL` |
| 3 | `/api/reviews/**`, `/api/admin/reviews/**`, `/api/doctors/{id}/reviews`, `/api/doctors/{id}/rating` | reviews-feedback-service | 8088 | `REVIEWS_URL` |
| 4 | `/api/doctors/**`, `/api/specialties`, `/api/languages`, `/api/directory/**`, `/api/admin/**` | doctor-directory-service | 8082 | `DOCTOR_URL` |
| 5 | `/api/availability/**`, `/api/appointments/**` | appointment-service | 8084 | `APPOINTMENT_URL` |

Pas encore routés (aucun endpoint publié) : ai-assessment, chat, medical-records, notification, admin-audit.

## CORS

Origine autorisée : `http://localhost:4200` (Angular). Méthodes : GET, POST, PUT, PATCH, DELETE, OPTIONS. Android n'est pas concerné.

## Tester (PowerShell)

```
curl.exe http://localhost:8090/actuator/health
curl.exe -i http://localhost:8090/api/specialties
```

Pour un POST, mettre le JSON dans un fichier :

```
'{"email":"test@test.com","password":"Test1234!"}' | Out-File -Encoding ascii "$env:TEMP\login.json"
curl.exe -i -X POST http://localhost:8090/api/auth/login -H "Content-Type: application/json" --data "@$env:TEMP\login.json"
```

Lecture des codes : 401/400 venant du service = route correcte ; 404 = route ou chemin absent ; 502/503 = service injoignable.

## Ajouter une route

1. Ajouter un bloc dans `application.yml` (`id`, `uri: ${NOM_URL:http://localhost:PORT}`, `Path=...`), avant toute route plus générale.
2. Ajouter la variable `NOM_URL` dans le bloc `api-gateway` de `infrastructure/docker-compose.yml`.
3. Reconstruire : `docker compose --env-file .env -f infrastructure/docker-compose.yml up -d --build api-gateway`.

## Points ouverts

- Port exposé : 8090 en local alors que le README indique 8080.
- appointment-service et ai-assessment-service utilisent tous deux 8084 (sans conflit dans Docker).
- Vérification du JWT à la gateway : non implémentée, chaque service valide le token.
- Proxy WebSocket du chat à tester.