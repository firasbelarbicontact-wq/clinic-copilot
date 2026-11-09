# Clinic Copilot - Medical Records Service

Microservice Spring Boot (Java 25). Consultations, notes cliniques, plans de médication, suivi de prise.
Écoute sur le port 8086 dans le conteneur (8091 en test local), base PostgreSQL `clinic_records`.

## Règles
- Seuls le patient concerné et le médecin auteur accèdent à un dossier. ADMIN : aucun accès clinique.
- Chaque accès (réussi ou refusé) est journalisé dans l'Audit Service, sans aucun contenu clinique.
- Les liens vers patients, médecins et rendez-vous sont des identifiants (jamais de clé étrangère inter-services).

## Test avec Docker (Windows)
1. `python scripts\mock_services.py`   (terminal 1)
2. `docker compose up --build`         (terminal 2)
3. `python scripts\smoke_test.py`      (terminal 3) : tous les contrôles doivent être OK

## À confirmer avec l'équipe
- Périmètre et endpoints (proposition) : à valider avec M4 (US-66, US-68).
- Consentement : vérifier le ConsentRecord du patient (Patient Profile Service) avant l'accès d'un médecin.
- Événement RabbitMQ vers Notification Service quand un plan change (rappels de prise).
- Port : 8086 est aussi celui de l'Audit Service dans mon projet ; à aligner avec le compose de l'équipe.
