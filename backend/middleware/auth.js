const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Priorité au cookie HttpOnly, avec repli sur les en-têtes pour les clients API
  let token = req.cookies && req.cookies.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }

  if (!token) {
    token = req.header('x-auth-token');
  }

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
  } catch {
    return res.status(401).json({ msg: 'Jeton invalide ou expiré.' });
  }
};
