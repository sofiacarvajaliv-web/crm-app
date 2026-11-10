const Opportunity = require('../models/Opportunity');
const Client = require('../models/Client');
const Company = require('../models/Company');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { createCrud } = require('../services/crudFactory');
const { str, idFilter } = require('../utils/query');

const crud = createCrud({
  Model: Opportunity,
  label: 'Oportunidad',
  searchFields: ['title'],
  sortable: ['title', 'estimatedValue', 'expectedCloseDate', 'status', 'createdAt'],
  scopeField: 'owner',
  defaultToCreator: true,
  populate: [
    { path: 'client', select: 'fullName email' },
    { path: 'company', select: 'name' },
    { path: 'owner', select: 'name' },
  ],
  buildFilter: (q, req) => {
    const f = {};
    if (str(q.status)) f.status = str(q.status);
    if (idFilter(q.client, 'cliente')) f.client = idFilter(q.client, 'cliente');
    if (idFilter(q.company, 'empresa')) f.company = idFilter(q.company, 'empresa');
    if (req.user.role === 'admin' && idFilter(q.owner, 'responsable')) f.owner = idFilter(q.owner, 'responsable');
    return f;
  },
  refChecks: [
    { field: 'client', model: Client, name: 'El cliente', advisorFilter: (req) => ({ assignedTo: req.user._id }) },
    { field: 'company', model: Company, name: 'La empresa' },
    { field: 'owner', model: User, name: 'El responsable' },
  ],
  // Si no se indica empresa, se hereda la del cliente.
  beforeCreate: async (data) => {
    if (!data.company) {
      const client = await Client.findById(data.client).select('company');
      if (client && client.company) data.company = client.company;
    }
  },
});

// Cambio rápido de estado (usado por el tablero Kanban).
const changeStatus = asyncHandler(async (req, res) => {
  const doc = await Opportunity.findOne({ _id: req.params.id, ...crud.scopeOf(req) });
  if (!doc) throw ApiError.notFound('Oportunidad no encontrada');
  doc.status = req.body.status;
  await doc.save();
  res.json(await Opportunity.findById(doc._id).populate('client', 'fullName email').populate('company', 'name').populate('owner', 'name').lean());
});

module.exports = { ...crud, changeStatus };
