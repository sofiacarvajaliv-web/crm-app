const Client = require('../models/Client');
const Company = require('../models/Company');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Opportunity = require('../models/Opportunity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { createCrud } = require('../services/crudFactory');
const { str, idFilter, parseListQuery } = require('../utils/query');

const crud = createCrud({
  Model: Client,
  label: 'Cliente',
  searchFields: ['fullName', 'email', 'idNumber'],
  sortable: ['fullName', 'email', 'city', 'status', 'clientType', 'registeredAt', 'createdAt'],
  scopeField: 'assignedTo',
  populate: [{ path: 'company', select: 'name' }, { path: 'assignedTo', select: 'name' }],
  buildFilter: (q, req) => {
    const f = {};
    if (str(q.clientType)) f.clientType = str(q.clientType);
    if (str(q.status)) f.status = str(q.status);
    if (idFilter(q.company, 'empresa')) f.company = idFilter(q.company, 'empresa');
    if (req.user.role === 'admin' && idFilter(q.assignedTo, 'responsable')) f.assignedTo = idFilter(q.assignedTo, 'responsable');
    return f;
  },
  refChecks: [
    { field: 'company', model: Company, name: 'La empresa' },
    { field: 'assignedTo', model: User, name: 'El responsable' },
  ],
  // Integridad: no se elimina un cliente con oportunidades asociadas.
  beforeDelete: async (doc) => {
    const n = await Opportunity.countDocuments({ client: doc._id });
    if (n > 0) throw ApiError.conflict(`No se puede eliminar: el cliente tiene ${n} oportunidad(es) asociada(s)`);
  },
  afterDelete: async (doc) => {
    await Promise.all([Activity.deleteMany({ client: doc._id }), Task.deleteMany({ client: doc._id })]);
  },
});

// Historial de actividades del cliente (más recientes primero).
const history = asyncHandler(async (req, res) => {
  const client = await Client.findOne({ _id: req.params.id, ...crud.scopeOf(req) }).select('_id');
  if (!client) throw ApiError.notFound('Cliente no encontrado');
  const { page, limit, skip } = parseListQuery(req.query, ['date'], '-date');
  const [data, total] = await Promise.all([
    Activity.find({ client: client._id }).sort('-date').skip(skip).limit(limit).populate('owner', 'name').lean(),
    Activity.countDocuments({ client: client._id }),
  ]);
  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
});

module.exports = { ...crud, history };
