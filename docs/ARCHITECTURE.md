# Architecture cible et exploitation (E21 - E26)

## E21 - Choix de l'hébergement

Pour héberger une application composée d'un frontend React servi par Nginx, d'une API Node.js/Express et d'une base MongoDB, on peut partir sur un hébergeur européen comme Scaleway (ou AWS / GCP) :

- Frontend + reverse proxy : conteneur Nginx sur Scaleway Serverless Containers (ou une instance dédiée derrière un Load Balancer).
- Backend API : conteneur Node 24 (`backend/Dockerfile`) avec au moins 2 instances en production pour tolérer un redémarrage.
- Base de données : MongoDB Atlas ou Scaleway Managed MongoDB dans la même région (`fr-par` / `eu-west`) pour avoir des sauvegardes automatiques quotidiennes et un Replica Set managé.
- Registre d'images : GitHub Container Registry (GHCR) ou le registre managé de l'hébergeur.

## E22 - Sécurisation de la production

- Seuls les ports 80 (redirigé vers HTTPS) et 443 sont ouverts sur Internet au niveau du reverse proxy / Load Balancer.
- Le backend (`5000`) et MongoDB (`27017`) restent dans un réseau privé sans accès public direct. En local avec `docker-compose.yml`, les réseaux `frontend-net` et `backend-net` séparent déjà le conteneur Nginx de MongoDB.
- Aucun fichier `.env` n'est versionné. Les secrets (`MONGO_URI`, `JWT_SECRET`) sont stockés dans le gestionnaire de secrets de l'hébergeur ou dans GitHub Environments Secrets, avec des valeurs différentes entre préproduction et production.
- Le conteneur backend tourne avec l'utilisateur non-root `node`, les sessions utilisent des cookies `HttpOnly` (`secure: true` en production), et l'API applique `helmet`, CORS restrictif, rate limiting et validation Joi.

## E23 - Nom de domaine, DNS et certificats HTTPS

Plan de sous-domaines pour séparer les deux environnements :

- Préproduction (`develop`) : `staging.mes-taches.exemple.fr` (frontend) et `api.staging.mes-taches.exemple.fr` (API).
- Production (`main`) : `app.mes-taches.exemple.fr` (frontend) et `api.mes-taches.exemple.fr` (API).

Configuration DNS et TLS :

- Enregistrements `A` / `AAAA` (ou `CNAME` vers le Load Balancer) sur chaque sous-domaine, plus un enregistrement `CAA` autorisant `letsencrypt.org`.
- Certificats TLS générés et renouvelés automatiquement via Let's Encrypt (Certbot ou Traefik/Load Balancer).
- Redirection HTTP -> HTTPS (code 301), TLS 1.2 / 1.3 activés et en-tête HSTS.
- Vérification après déploiement avec `curl -I https://app.mes-taches.exemple.fr` et `openssl s_client -connect app.mes-taches.exemple.fr:443`.

## E24 - Conteneurisation et CI/CD

- Conteneurisation : `backend/Dockerfile`, `frontend/Dockerfile` (build multi-stage + Nginx) et `docker-compose.yml`.
- Pipeline GitHub Actions (`.github/workflows/ci-cd.yml`) exécuté à chaque push/PR :
  1. Lint et vérification Prettier (`eslint`, `prettier --check`).
  2. Audit de sécurité (`npm audit`).
  3. Tests backend (`node --test` + `supertest`) et frontend (`@testing-library/react`).
  4. Build du frontend et construction des images Docker.
- Le script `deploy.sh` permet de lancer les vérifications, reconstruire les conteneurs et vérifier `/api/health` sur le serveur cible. En cas d'échec, il suffit de redéployer le tag d'image précédent.

## E25 - Journalisation et audit

- Les `console.log` ont été remplacés par `winston` dans le backend (`logs/error.log` pour les erreurs, `logs/combined.log` pour les requêtes HTTP et événements auth, sans jamais enregistrer les mots de passe ou jetons).
- En développement, `npm run dev:debug` active les traces `debug` (`DEBUG=app:*`).
- `npm audit` est exécuté dans la CI pour détecter les vulnérabilités critiques ou hautes.

## E26 - Supervision et alertes

- Santé de l'application : `GET /api/health` renvoie `200` si MongoDB est connecté (`503` sinon), et Nginx expose `/health`.
- Avec `docker compose --profile monitoring up -d`, Uptime Kuma (`http://localhost:3001`) permet de surveiller directement `http://backend:5000/api/health`.
- Exemples de seuils d'alertes (définis dans `monitoring/alerts.yml` pour une stack Prometheus/Grafana) :
  - API down : service injoignable pendant plus d'1 minute (critique).
  - Taux d'erreurs 5xx > 5 % sur 5 minutes (warning).
  - Latence p95 > 500 ms sur 5 minutes (warning).
