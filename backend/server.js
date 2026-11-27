// Point d'entrée du serveur backend
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);

if (missingEnvVars.length > 0) {
  console.error(`Variables d'environnement manquantes : ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET doit contenir au moins 32 caractères.');
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10kb' }));
// Empêche les injections d'opérateurs MongoDB ($gt, $ne...) dans les requêtes
app.use(mongoSanitize());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));

// Gestion des routes inexistantes
app.use((req, res) => {
  res.status(404).json({ msg: 'Route introuvable.' });
});

// Gestionnaire d'erreurs global en JSON
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return res.status(400).json({ msg: 'Corps de requête JSON invalide.' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ msg: 'Données invalides.' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ msg: 'Identifiant invalide.' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ msg: 'Cette ressource existe déjà.' });
  }

  console.error(err.stack || err.message);
  return res.status(500).json({ msg: 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

if (require.main === module) {
  startServer();
}

module.exports = app;
