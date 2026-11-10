const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

// Hash ficticio para igualar tiempos de respuesta cuando el correo no existe.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.4pJvHqTzS5sY3o4yqZ8g1Yb2GJ0W';
const bcrypt = require('bcryptjs');

// Solo permite el registro público mientras NO exista ningún usuario:
// crea el administrador inicial. Después, solo un admin crea usuarios.
const register = asyncHandler(async (req, res) => {
  if ((await User.estimatedDocumentCount()) > 0) {
    throw ApiError.forbidden('El registro público está deshabilitado. Solicita acceso a un administrador.');
  }
  const user = await User.create({ ...req.body, role: 'admin' });
  res.status(201).json({ token: signToken(user), user });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  const valid = user ? await user.comparePassword(password) : (await bcrypt.compare(password, DUMMY_HASH), false);
  if (!user || !valid || !user.active) throw ApiError.unauthorized('Credenciales inválidas');
  res.json({ token: signToken(user), user });
});

const me = (req, res) => res.json({ user: req.user });

// Indica al frontend si debe mostrar el registro del administrador inicial.
const setupStatus = asyncHandler(async (req, res) => {
  res.json({ needsSetup: (await User.estimatedDocumentCount()) === 0 });
});

module.exports = { register, login, me, setupStatus };
