# Architecture cible et exploitation (E21 - E26)

## E21 - Choix de l'hébergement

Pour déployer l'application simplement avec HTTPS automatique et un coût maîtrisé, l'architecture cible repose sur Render et MongoDB Atlas (déployable via `render.yaml`) :

- Frontend : Static Site sur Render (`frontend/`, build `npm ci && npm run build`), avec une règle de rewrite `/api/*` vers le backend pour éviter les problèmes de cookies cross-site.
- Backend API : Web Service Docker sur Render (`backend/Dockerfile`, Node 24) avec sonde de santé sur `/api/health`.
- Base de données : cluster MongoDB Atlas (M0 gratuit en test/préprod, ou cluster dédié en Europe pour la production avec sauvegardes automatiques quotidiennes).

## E22 - Sécurisation de la production

- Tout le trafic public passe en HTTPS via le reverse proxy Render (aucun accès direct au port MongoDB).
- Aucun fichier `.env` n'est versionné. Les secrets (`MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`) sont stockés dans les variables d'environnement Render, avec des valeurs distinctes entre préproduction et production.
- Le conteneur backend tourne avec l'utilisateur non-root `node`, les sessions utilisent des cookies `HttpOnly` (`secure: true` en production), et l'API applique `helmet`, CORS restrictif, rate limiting et validation Joi.

## E23 - Nom de domaine, DNS et certificats HTTPS

Plan de sous-domaines pour séparer les deux environnements (ou utilisation des sous-domaines `.onrender.com` fournis) :

- Préproduction (`develop`) : `staging.mes-taches.exemple.fr`
- Production (`main`) : `app.mes-taches.exemple.fr`

Configuration DNS et TLS :

- Ajout d'un enregistrement `CNAME` (ou `ALIAS`/`ANAME` à la racine) vers la cible fournie par Render dans les Custom Domains.
- Certificats TLS Let's Encrypt générés et renouvelés automatiquement par Render, avec redirection HTTP -> HTTPS et TLS 1.2 / 1.3.
- Vérification après déploiement avec `curl -I https://app.mes-taches.exemple.fr` et `openssl s_client -connect app.mes-taches.exemple.fr:443`.

## E24 - Conteneurisation et CI/CD

- Conteneurisation : `backend/Dockerfile`, `frontend/Dockerfile` (build multi-stage + Nginx) et `docker-compose.yml` pour l'exécution locale.
- Pipeline GitHub Actions (`.github/workflows/ci-cd.yml`) exécuté à chaque push/PR :
  1. Lint et vérification Prettier (`eslint`, `prettier --check`).
  2. Audit de sécurité (`npm audit`).
  3. Tests backend (`node --test` + `supertest`) et frontend (`@testing-library/react`).
  4. Build du frontend et construction des images Docker.
- Sur Render, chaque push sur la branche configurée déclenche automatiquement le redéploiement après validation de la CI, avec rollback possible en un clic vers un déploiement précédent depuis le dashboard Render.
- Le script `deploy.sh` reste disponible pour un déploiement Docker sur VPS.

## E25 - Journalisation et audit

- Les `console.log` ont été remplacés par `winston` dans le backend (`stdout` JSON collecté dans les logs Render, ainsi que `logs/error.log` et `logs/combined.log` en local, sans jamais enregistrer les mots de passe ou jetons).
- En développement, `npm run dev:debug` active les traces `debug` (`DEBUG=app:*`).
- `npm audit` est exécuté dans la CI pour détecter les vulnérabilités critiques ou hautes.

## E26 - Supervision et alertes

- Santé de l'application : `GET /api/health` renvoie `200` si MongoDB est connecté (`503` sinon), utilisé directement par le `healthCheckPath` de Render.
- En local avec `docker compose --profile monitoring up -d`, Uptime Kuma (`http://localhost:3001`) permet de surveiller `/api/health`. En ligne, Uptime Kuma ou les notifications Render/UptimeRobot préviennent en cas d'indisponibilité.
- Exemples de seuils d'alertes (dans `monitoring/alerts.yml`) :
  - API down : service injoignable pendant plus d'1 minute (critique).
  - Taux d'erreurs 5xx > 5 % sur 5 minutes (warning).
  - Latence p95 > 500 ms sur 5 minutes (warning).
