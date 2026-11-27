# Changelog

## [1.1.0] - 2026-11-27

### Sécurité
- Retrait de `backend/.env` du suivi Git, mise à jour des `.gitignore` et ajout des fichiers `.env.example`.
- Contrôle de `MONGO_URI` et `JWT_SECRET` (minimum 32 caractères) au démarrage du serveur.
- Correction de la faille IDOR sur `PUT` et `DELETE /api/tasks/:id` en filtrant par `user: req.user.id`.
- Validation des entrées avec Joi (`register`, `login`, `createTask`, `updateTask`), nettoyage HTML avec `sanitize-html` et protection anti-injection NoSQL via `express-mongo-sanitize`.
- Remplacement du stockage JWT dans `localStorage` par un cookie `HttpOnly` (`POST /api/auth/logout`, `GET /api/auth/me`, `withCredentials: true` côté client).
- Ajout de `helmet`, restriction CORS via `CLIENT_URL`, limitation de débit sur `/api` et `/api/auth/*`, coût `bcrypt` passé à 12 et `select: false` sur le mot de passe.
- Mise à jour des dépendances (`npm audit` backend à 0 vulnérabilité, mise à jour d'`axios` et `react-router-dom` côté frontend).

### Corrections
- Remplacement du statut HTTP `418` par `401` dans `middleware/auth.js`.
- Suppression des `throw` dans les callbacks `jwt.sign` et gestion unifiée des erreurs en JSON (plus de réponses en texte brut ni de crash sur ObjectId invalide).
- Remplacement de `Task.findByIdAndRemove` par `Task.findOneAndDelete` et suppression des options obsolètes de `mongoose.connect`.
- Attente de la connexion MongoDB avant de lancer `app.listen()` et alignement du port sur `5000`.
- Mise à jour immédiate de la liste après ajout d'une tâche dans `Tasks.js` et possibilité de cocher une tâche terminée (`isCompleted`).
- Blocage des formulaires vides (`TaskForm`, `Login`, `Register`) avec messages d'erreur visibles.
- Protection de la route `/tasks`, redirection à la déconnexion et sur expiration de session (`401`), ajout de liens entre connexion et inscription.
- Suppression de la double balise `<header>` dans `App.js`, correction du débordement horizontal CSS et passage des textes en français.

### Ajouts
- Journalisation avec `winston` (`logs/error.log` et `logs/combined.log`) et mode `debug` (`npm run dev:debug`).
- Route `GET /api/health` pour vérifier l'état du serveur et de MongoDB.
- Dockerfiles backend et frontend (Nginx), `docker-compose.yml` (avec profil monitoring Uptime Kuma), pipeline CI `.github/workflows/ci-cd.yml` et script `deploy.sh`.
- Règles d'alertes dans `monitoring/alerts.yml` et documentation d'architecture dans `docs/ARCHITECTURE.md`.
- Tests automatisés backend (`node --test` + `supertest`) et frontend (`@testing-library/react`).
- Configuration ESLint et Prettier sur le backend et le frontend, plus commentaires JSDoc.

## [1.0.0] - 2025-10-09

- Version initiale du projet d'entraînement.
