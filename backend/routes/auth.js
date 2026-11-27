const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../validators/schemas');

// @route   POST api/auth/register
// @desc    Inscrire un nouvel utilisateur
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

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      algorithm: 'HS256',
    });

    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

// @route   POST api/auth/login
// @desc    Authentifier un utilisateur et retourner son jeton
router.post('/login', async (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ msg: error.details[0].message });
  }

  const { username, password } = value;

  try {
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ msg: 'Identifiants invalides.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Identifiants invalides.' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      algorithm: 'HS256',
    });

    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
