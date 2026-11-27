const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const debug = require('debug')('app:auth');
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const { registerSchema, loginSchema } = require('../validators/schemas');

/**
 * Options du cookie HttpOnly utilisé pour transporter le jeton JWT.
 */
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
  };
}

// POST /api/auth/register - Inscription et création du cookie de session
router.post('/register', async (req, res, next) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  const { username, password } = value;

  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(409).json({ msg: "Ce nom d'utilisateur est déjà pris." });
    }

    user = new User({ username, password });

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);

    await user.save();
    logger.info('Nouvel utilisateur inscrit', { username: user.username });
    debug('Utilisateur créé : %s', user.username);

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      algorithm: 'HS256',
    });

    res.cookie('token', token, getCookieOptions());
    return res.status(201).json({
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login - Connexion et ouverture de session
router.post('/login', async (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  const { username, password } = value;

  try {
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      logger.warn('Tentative de connexion échouée', { username, ip: req.ip });
      return res.status(401).json({ msg: 'Identifiants invalides.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Tentative de connexion échouée', { username, ip: req.ip });
      return res.status(401).json({ msg: 'Identifiants invalides.' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      algorithm: 'HS256',
    });

    logger.info('Connexion réussie', { username: user.username });
    debug('Session ouverte pour : %s', user.username);
    res.cookie('token', token, getCookieOptions());
    return res.json({
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/logout - Suppression du cookie de session
router.post('/logout', (req, res) => {
  debug('Déconnexion demandée');
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ msg: 'Déconnexion réussie.' });
});

// GET /api/auth/me - Vérifie la session en cours
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('username');
    if (!user) {
      return res.status(401).json({ msg: 'Utilisateur introuvable.' });
    }

    return res.json({
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
