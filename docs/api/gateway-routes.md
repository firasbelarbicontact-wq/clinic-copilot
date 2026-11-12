# API Gateway : routes

La gateway est le point d'entrée unique du backend. Angular et Android n'appellent qu'elle ; 
elle redirige chaque requête vers le bon service **sans modifier le chemin**.

- Code : `backend/api-gateway`
- Configuration des routes : `backend/api-gateway/src/main/resources/application.yml`
- URL en local (Docker) : `http://localhost:8080`
- Santé : `GET /actuator/health` · routes chargées : `GET /actuator/gateway/routes`

## Routes

Les routes sont évaluées dans l'ordre : les plus spécifiques passent avant les plus générales (*first match wins*).

| Ordre | Chemins | Service | Port interne | Variable Docker |
|---|---|---|---|---|
| 1 | `/api/admin/reviews/**` | reviews-feedback-service | 8088 | `REVIEWS_SERVICE_URL` |
| 2 | `/api/admin/audit/**` | admin-audit-service | 8089 | `ADMIN_AUDIT_URL` |
| 3 | `/api/admin/**` | doctor-directory-service | 8082 | `DOCTOR_DIRECTORY_URL` |
| 4 | `/api/auth/**`, `/api/users/**` | identity-profile-service | 8081 | `IDENTITY_SERVICE_URL` |
| 5 | `/api/patient-profiles/**` | patient-profile-service | 8090 | `PATIENT_PROFILE_URL` |
| 6 | `/api/reviews/**`, `/api/doctors/{id}/reviews`, `/api/doctors/{id}/rating` | reviews-feedback-service | 8088 | `REVIEWS_SERVICE_URL` |
| 7 | `/api/availability/**`, `/api/appointments/**` | appointment-service | 8084 | `APPOINTMENT_SERVICE_URL` |
| 8 | `/api/v1/consultations/**`, `/api/v1/medications/**` | medical-records-service | 8086 | `MEDICAL_RECORDS_URL` |
| 9 | `/api/doctors/**`, `/api/specialties/**`, `/api/languages/**`, `/api/directory/**` | doctor-directory-service | 8082 | `DOCTOR_DIRECTORY_URL` |

Pas encore routés (en cours de développement) : ai-assessment, chat, notification.

## CORS

Origine autorisée : `http://localhost:4200` (Angular). Méthodes : GET, POST, PUT, PATCH, DELETE, OPTIONS. Android n'est pas concerné.

## Tester (PowerShell)

```
curl.exe http://localhost:8080/actuator/health
curl.exe -i http://localhost:8080/api/specialties
```

Pour un POST, mettre le JSON dans un fichier :

```
'{"email":"test@test.com","password":"Test1234!"}' | Out-File -Encoding ascii "$env:TEMP\login.json"
curl.exe -i -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" --data "@$env:TEMP\login.json"
```

Lecture des codes : 401/400 venant du service = route correcte ; 404 = route ou chemin absent ; 502/503 = service injoignable.
