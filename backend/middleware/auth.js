// src/middleware/auth.js
// Middleware que verifica el JWT en la cabecera Authorization.
// Añade req.user = { id, plan, account_type } si el token es válido.

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, plan, account_type, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Verifica que el usuario tenga un plan pro activo
function requirePro(req, res, next) {
  if (!req.user || req.user.plan === 'free') {
    return res.status(403).json({ error: 'Se requiere un plan Pro para esta acción' });
  }
  next();
}

module.exports = { requireAuth, requirePro };
