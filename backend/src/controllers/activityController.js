const Activity = require('../models/Activity');
const Client = require('../models/Client');
const User = require('../models/User');
const { createCrud } = require('../services/crudFactory');
const { str, idFilter } = require('../utils/query');

module.exports = createCrud({
  Model: Activity,
  label: 'Actividad',
  searchFields: ['description', 'result'],
  sortable: ['date', 'type', 'createdAt'],
  defaultSort: '-date',
  scopeField: 'owner',
  defaultToCreator: true,
  populate: [{ path: 'client', select: 'fullName' }, { path: 'owner', select: 'name' }],
  buildFilter: (q, req) => {
    const f = {};
    if (str(q.type)) f.type = str(q.type);
    if (idFilter(q.client, 'cliente')) f.client = idFilter(q.client, 'cliente');
    if (req.user.role === 'admin' && idFilter(q.owner, 'responsable')) f.owner = idFilter(q.owner, 'responsable');
    const from = str(q.from) && new Date(q.from);
    const to = str(q.to) && new Date(q.to);
    if ((from && !isNaN(from)) || (to && !isNaN(to))) {
      f.date = {};
      if (from && !isNaN(from)) f.date.$gte = from;
      if (to && !isNaN(to)) f.date.$lte = to;
    }
    return f;
  },
  refChecks: [
    { field: 'client', model: Client, name: 'El cliente', advisorFilter: (req) => ({ assignedTo: req.user._id }) },
    { field: 'owner', model: User, name: 'El responsable' },
  ],
});
