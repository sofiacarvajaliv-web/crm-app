const Company = require('../models/Company');
const Client = require('../models/Client');
const Opportunity = require('../models/Opportunity');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { createCrud } = require('../services/crudFactory');
const { str } = require('../utils/query');

const crud = createCrud({
  Model: Company,
  label: 'Empresa',
  searchFields: ['name', 'taxId', 'email'],
  sortable: ['name', 'sector', 'city', 'createdAt'],
  defaultSort: 'name',
  buildFilter: (q) => {
    const f = {};
    if (str(q.sector)) f.sector = str(q.sector);
    if (str(q.city)) f.city = str(q.city);
    return f;
  },
  beforeDelete: async (doc) => {
    const [clients, opps] = await Promise.all([
      Client.countDocuments({ company: doc._id }),
      Opportunity.countDocuments({ company: doc._id }),
    ]);
    if (clients || opps) {
      throw ApiError.conflict(`No se puede eliminar: la empresa tiene ${clients} contacto(s) y ${opps} oportunidad(es) asociada(s)`);
    }
  },
});

// Contactos (clientes) asociados a la empresa.
const contacts = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id).select('_id');
  if (!company) throw ApiError.notFound('Empresa no encontrada');
  const scope = req.user.role === 'admin' ? {} : { assignedTo: req.user._id };
  const data = await Client.find({ company: company._id, ...scope }).sort('fullName').select('fullName email phone status clientType').lean();
  res.json({ data, total: data.length });
});

module.exports = { ...crud, contacts };
