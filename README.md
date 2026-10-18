# Clinic Copilot

Plateforme d'aide à l'orientation médicale : décrire ses symptômes, recevoir des conseils prudents, trouver un médecin, réserver, discuter et recevoir des rappels.

> **Avertissement :** Clinic Copilot ne remplace ni un médecin, ni les services d'urgence. Le module IA est expérimental.

## Technologies

| Partie | Technologie |
|---|---|
| Web | Angular + TypeScript |
| Mobile | Kotlin + Jetpack Compose (Android) |
| Backend | Java 21 + Spring Boot (10 microservices) |
| Gateway | Spring Cloud Gateway |
| Base de données | PostgreSQL 16 (une base par service) |
| Messagerie | RabbitMQ |
| Conteneurs | Docker + Docker Compose |

## Structure du projet

```
clinic-copilot/
├── backend/                 10 microservices Spring Boot (1 Dockerfile chacun)
│   ├── api-gateway/
│   ├── identity-profile-service/
│   ├── doctor-directory-service/
│   ├── appointment-service/
│   ├── ai-assessment-service/
│   ├── chat-service/
│   ├── medical-records-service/
│   ├── notification-service/
│   ├── reviews-feedback-service/
│   └── admin-audit-service/
├── frontend/web-angular/    Application web Angular
├── mobile/android-kotlin/   Application Android (Android Studio)
├── infrastructure/          docker-compose.yml, scripts SQL, RabbitMQ, Ollama
├── docs/                    Architecture, API, base de données, décisions
├── scripts/                 dev-start.ps1 / dev-stop.ps1
├── .env.example             Modèle des variables d'environnement
└── README.md
```

---

## 1. Prérequis

Installer :

| Outil | Version | Vérification |
|---|---|---|
| Git | dernière | `git --version` |
| Docker Desktop | dernière | `docker --version` |
| JDK (si vous développez le backend hors Docker) | 21 | `java -version` |
| Node.js (si vous développez le frontend hors Docker) | 22 LTS | `node -v` |
| Android Studio (pour le mobile) | dernière | |

**Pour lancer le projet avec Docker, seuls Git et Docker Desktop sont nécessaires.**

> **Windows :** clonez le projet dans un chemin **simple, sans accents ni espaces**, par exemple `C:\projects\clinic-copilot`. Évitez le Bureau (OneDrive) : cela cause des erreurs avec npm, Maven et Docker.

---

## 2. Lancer le projet (démarrage rapide)

### Étape 1 : cloner

```powershell
git clone https://github.com/VOTRE_USER/clinic-copilot.git
cd clinic-copilot
```

### Étape 2 : créer le fichier `.env`

```powershell
copy .env.example .env
```

Le fichier `.env` contient les mots de passe locaux. Il n'est **jamais** envoyé sur Git.

### Étape 3 : démarrer Docker Desktop

Ouvrez Docker Desktop et attendez le message **« Engine running »**.

### Étape 4 : construire et lancer

```powershell
docker compose --env-file .env -f infrastructure/docker-compose.yml up -d --build
```

Le premier build est long (10 à 20 minutes). Les suivants sont rapides grâce au cache.

> **PC avec peu de RAM (moins de 16 Go) ?** Lancez par groupes :
> ```powershell
> docker compose --env-file .env -f infrastructure/docker-compose.yml up -d --build postgres rabbitmq identity-profile-service api-gateway frontend
> ```
> Puis ajoutez les autres services au fur et à mesure.

### Étape 5 : vérifier

```powershell
docker compose --env-file .env -f infrastructure/docker-compose.yml ps
```

Tous les conteneurs doivent être `Up` (et `healthy` pour postgres).

---

## 3. Adresses et ports

| Service | Adresse | Remarque |
|---|---|---|
| Frontend Angular | http://localhost:4200 | Application web |
| API Gateway | http://localhost:8080 | Point d'entrée de l'API |
| RabbitMQ (interface) | http://localhost:15672 | Identifiants du `.env` |
| PostgreSQL | `localhost:5433` | Utilisateur et mot de passe du `.env` |

Ports internes des microservices (accessibles seulement entre conteneurs) :

| Service | Port | Base de données |
|---|---|---|
| api-gateway | 8080 | aucune |
| identity-profile-service | 8081 | clinic_identity |
| doctor-directory-service | 8082 | clinic_doctors |
| appointment-service | 8083 | clinic_appointments |
| ai-assessment-service | 8084 | clinic_ai |
| chat-service | 8085 | clinic_chat |
| medical-records-service | 8086 | clinic_records |
| notification-service | 8087 | clinic_notifications |
| reviews-feedback-service | 8088 | clinic_reviews |
| admin-audit-service | 8089 | clinic_admin |

Chaque service possède **sa propre base**. Les services ne partagent jamais de tables : ils communiquent par API ou par événements RabbitMQ.

---

## 4. Commandes Docker utiles

Pour raccourcir, définissez un alias dans votre session PowerShell :

```powershell
function cc { docker compose --env-file .env -f infrastructure/docker-compose.yml @args }
```

| Action | Commande |
|---|---|
| Voir l'état | `cc ps` |
| Voir les logs d'un service | `cc logs -f identity-profile-service` |
| Dernières lignes des logs | `cc logs --tail 40 identity-profile-service` |
| Reconstruire un seul service | `cc up -d --build identity-profile-service` |
| Redémarrer un service | `cc restart identity-profile-service` |
| Arrêter tout | `cc down` |
| Arrêter et **effacer les données** | `cc down -v` |
| Se connecter à PostgreSQL | `cc exec postgres psql -U clinic -d clinic_identity` |
| Lister les bases | `cc exec postgres psql -U clinic -c "\l"` |

Scripts raccourcis :

```powershell
.\scripts\dev-start.ps1     # démarre tout
.\scripts\dev-stop.ps1      # arrête tout
```

> Le script SQL qui crée les bases (`infrastructure/postgres/init/`) ne s'exécute **qu'à la première création** du volume. Si vous le modifiez, faites `cc down -v` puis relancez.

---

## 5. Développer sans Docker (optionnel)

### Un microservice Spring Boot

1. Lancer uniquement PostgreSQL et RabbitMQ :
   ```powershell
   docker compose --env-file .env -f infrastructure/docker-compose.yml up -d postgres rabbitmq
   ```
2. Lancer le service :
   ```powershell
   cd backend\identity-profile-service
   .\mvnw.cmd spring-boot:run
   ```
   Le service utilise `localhost:5433` si vous définissez `DB_URL` :
   ```powershell
   $env:DB_URL="jdbc:postgresql://localhost:5433/clinic_identity"
   $env:DB_USER="clinic"
   $env:DB_PASSWORD="change_me"
   .\mvnw.cmd spring-boot:run
   ```
3. Tester : `curl.exe http://localhost:8081/actuator/health`

> Pensez à arrêter le conteneur du même service avant, sinon le port sera occupé.

### Le frontend Angular

```powershell
cd frontend\web-angular
npm install
ng serve
```

Ouvrir http://localhost:4200.

### L'application Android

1. Ouvrir `mobile/android-kotlin` dans **Android Studio**.
2. Attendre la fin du Gradle sync.
3. Lancer sur un émulateur (Device Manager, par exemple Pixel 7).

Depuis l'émulateur, `localhost` désigne le téléphone. Pour joindre le backend sur votre PC, utilisez :

```
http://10.0.2.2:8080
```

---

## 6. Travailler en équipe avec Git

```powershell
git checkout -b feature/nom-de-la-fonctionnalite    # nouvelle branche
git add .
git commit -m "Message clair"
git push -u origin feature/nom-de-la-fonctionnalite
```

Puis ouvrir une Pull Request sur GitHub.

Règles :

- Ne jamais travailler directement sur `main`.
- Faire `git pull` avant de commencer à travailler.
- Ne **jamais** committer `.env`, des mots de passe, des clés JWT ou Firebase.
- Un service = un dossier dans `backend/`. Évitez de modifier le service d'un coéquipier sans l'en informer.

---

## 7. Images Docker Hub

Les images sont nommées `DOCKERHUB_USER/clinic-<service>:1.0`.

Pour publier (responsable du dépôt uniquement) :

1. Mettre son identifiant Docker Hub dans `.env` : `DOCKERHUB_USER=monidentifiant`
2. Puis :
   ```powershell
   docker login
   docker compose --env-file .env -f infrastructure/docker-compose.yml build
   docker compose --env-file .env -f infrastructure/docker-compose.yml push
   ```

Les dépôts gratuits sont publics : aucun secret ne doit se trouver dans une image.

---

## 8. Problèmes fréquents

| Problème | Cause | Solution |
|---|---|---|
| `failed to connect to the docker API` | Docker Desktop n'est pas démarré | Lancer Docker Desktop, attendre « Engine running » |
| `port is already allocated` (5432, 8080, 4200…) | Un autre programme utilise le port | Arrêter le programme, ou changer le port à gauche dans `docker-compose.yml` (`"5433:5432"`) |
| `pull access denied for votreuser/...` | Les images n'existent pas encore sur Docker Hub | Sans gravité : Docker les construit localement |
| `npm ci` échoue dans le frontend | `package-lock.json` créé sous Windows | Le Dockerfile utilise déjà `npm install` |
| `Cannot read properties of null (reading 'edgesOut')` | Bug npm / chemin avec accents ou OneDrive | Déplacer le projet vers `C:\projects`, supprimer `node_modules` et `package-lock.json`, relancer `npm install` |
| `password authentication failed` ou `database ... does not exist` | Volume PostgreSQL ancien ou incomplet | `cc down -v` puis relancer |
| Un service est en `Exited` | Erreur au démarrage | `cc logs --tail 50 nom-du-service` |
| Le build se fige ou le PC rame | Manque de mémoire | Augmenter la RAM dans Docker Desktop (Settings, Resources), ou lancer par groupes |
| `curl` se comporte bizarrement sous PowerShell | `curl` est un alias de `Invoke-WebRequest` | Utiliser `curl.exe` |

---

## 9. Sécurité

- Changer **tous** les `change_me` dans `.env` avant tout déploiement.
- Ne jamais exposer PostgreSQL, RabbitMQ ou Ollama sur Internet.
- L'API Gateway ne remplace pas l'authentification : chaque service vérifie lui-même les droits.
- Les logs ne doivent pas contenir de symptômes ni de données médicales.

---

## 10. Avancement

| Élément | État |
|---|---|
| Structure du projet | fait |
| Conteneurisation (10 services, frontend, PostgreSQL, RabbitMQ) | fait |
| Authentification JWT (Identity) | à faire |
| Routes de l'API Gateway | à faire |
| Annuaire médecins, rendez-vous | à faire |
| Chat temps réel (WebSocket/STOMP) | à faire |
| Module IA (Ollama) | à faire |
| Application Android | squelette |

## Ordre de travail conseillé

1. Identity : inscription, connexion, JWT.
2. API Gateway : routes vers Identity.
3. Frontend : page de connexion.
4. Doctor Directory, puis Appointment.
5. Ensuite : RabbitMQ, Chat, Notification, IA.

## Équipe

Projet réalisé dans le cadre de la formation DSI 32.

| Nom | Rôle |
|---|---|
| À compléter | À compléter |