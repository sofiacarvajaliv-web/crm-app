const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Exige un JWT válido y carga el usuario actual desde la base de datos
// (así los cambios de rol o la desactivación aplican de inmediato).
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized('Sesión inválida o expirada');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.active) throw ApiError.unauthorized('Usuario no disponible');
  req.user = user;
  next();
});

// Restringe por rol. Uso: authorize('admin')
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(ApiError.forbidden());

module.exports = { protect, authorize };
