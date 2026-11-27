#!/usr/bin/env bash
set -euo pipefail

if [ ! -f .env ]; then
  echo "Fichier .env manquant à la racine (copiez .env.example vers .env)."
  exit 1
fi

echo "Vérification backend..."
(cd backend && npm run lint && npm test)

echo "Vérification frontend..."
(cd frontend && npm run lint && CI=true npm test -- --watchAll=false)

echo "Démarrage des conteneurs Docker..."
docker compose up -d --build

echo "Vérification de /api/health..."
for i in $(seq 1 15); do
  if curl -fsS http://localhost:5000/api/health >/dev/null 2>&1; then
    echo "Déploiement OK."
    exit 0
  fi
  sleep 2
done

echo "Erreur : l'API ne répond pas."
exit 1
