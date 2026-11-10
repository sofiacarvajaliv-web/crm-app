const Task = require('../models/Task');
const Client = require('../models/Client');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { createCrud } = require('../services/crudFactory');
const { str, idFilter } = require('../utils/query');

const crud = createCrud({
  Model: Task,
  label: 'Tarea',
  searchFields: ['title', 'description'],
  sortable: ['title', 'dueDate', 'priority', 'status', 'createdAt'],
  defaultSort: 'dueDate',
  scopeField: 'assignedTo',
  defaultToCreator: true,
  populate: [{ path: 'client', select: 'fullName' }, { path: 'assignedTo', select: 'name' }],
  buildFilter: (q, req) => {
    const f = {};
    if (str(q.status)) f.status = str(q.status);
    if (str(q.priority)) f.priority = str(q.priority);
    if (idFilter(q.client, 'cliente')) f.client = idFilter(q.client, 'cliente');
    if (req.user.role === 'admin' && idFilter(q.assignedTo, 'responsable')) f.assignedTo = idFilter(q.assignedTo, 'responsable');
    // Vencidas: fecha límite pasada y no completadas.
    if (str(q.overdue) === 'true') {
      f.dueDate = { $lt: new Date() };
      f.status = { $ne: 'completada' };
    }
    return f;
  },
  refChecks: [
    { field: 'client', model: Client, name: 'El cliente', advisorFilter: (req) => ({ assignedTo: req.user._id }) },
    { field: 'assignedTo', model: User, name: 'El responsable' },
  ],
});

const changeStatus = asyncHandler(async (req, res) => {
  const doc = await Task.findOne({ _id: req.params.id, ...crud.scopeOf(req) });
  if (!doc) throw ApiError.notFound('Tarea no encontrada');
  doc.status = req.body.status;
  await doc.save();
  res.json(doc);
});

module.exports = { ...crud, changeStatus };
