const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'Accès refusé : aucun jeton fourni.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    if (!decoded || !decoded.user || !decoded.user.id) {
      return res.status(401).json({ msg: 'Jeton invalide.' });
    }

    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Jeton invalide ou expiré.' });
  }
};
