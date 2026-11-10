const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { parseListQuery, searchFilter, str } = require('../utils/query');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseListQuery(req.query, ['name', 'email', 'role', 'createdAt']);
  const filter = {};
  if (['admin', 'advisor'].includes(str(req.query.role))) filter.role = req.query.role;
  if (['true', 'false'].includes(str(req.query.active))) filter.active = req.query.active === 'true';
  Object.assign(filter, searchFilter(req.query.search, ['name', 'email']) || {});
  const [data, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

const create = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json(user);
});

const update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  const isSelf = String(user._id) === String(req.user._id);
  if (isSelf && (req.body.active === false || (req.body.role && req.body.role !== 'admin'))) {
    throw ApiError.badRequest('No puedes desactivarte ni quitarte el rol de administrador');
  }
  user.set(req.body); // si viene password, el hook pre-save la cifra
  await user.save();
  res.json(user);
});

// Los usuarios no se borran (conservan su historial): se desactivan.
const deactivate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Usuario no encontrado');
  if (String(user._id) === String(req.user._id)) throw ApiError.badRequest('No puedes desactivar tu propia cuenta');
  user.active = false;
  await user.save();
  res.json({ message: 'Usuario desactivado' });
});

// Lista liviana para selects de "responsable" (cualquier usuario autenticado).
const options = asyncHandler(async (req, res) => {
  const users = await User.find({ active: true }).select('name role').sort('name');
  res.json(users);
});

module.exports = { list, create, update, deactivate, options };
