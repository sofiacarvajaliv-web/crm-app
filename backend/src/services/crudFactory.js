// Fábrica de controladores CRUD con paginación, búsqueda, filtros, orden,
// alcance por rol (los asesores solo ven lo suyo) y verificación de referencias.
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { parseListQuery, searchFilter } = require('../utils/query');

function createCrud(cfg) {
  const {
    Model,
    label,
    searchFields = [],
    sortable = ['createdAt'],
    defaultSort = '-createdAt',
    scopeField = null,        // campo que enlaza el registro con su responsable
    defaultToCreator = false, // si el admin no envía responsable, se asigna a sí mismo
    populate = [],
    buildFilter = () => ({}),
    refChecks = [],           // [{ field, model, name, advisorFilter?(req) }]
    beforeCreate,
    beforeDelete,
    afterDelete,
  } = cfg;

  const scopeOf = (req) => (scopeField && req.user.role !== 'admin' ? { [scopeField]: req.user._id } : {});
  const populated = (q) => populate.reduce((acc, p) => acc.populate(p), q);

  async function checkRefs(data, req) {
    for (const { field, model, name, advisorFilter } of refChecks) {
      if (!data[field]) continue;
      const filter = { _id: data[field] };
      if (advisorFilter && req.user.role !== 'admin') Object.assign(filter, advisorFilter(req));
      if (!(await model.exists(filter))) {
        throw ApiError.badRequest(`${name} no existe o no tienes acceso`, [{ field, message: `${name} no válido` }]);
      }
    }
  }

  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip, sort } = parseListQuery(req.query, sortable, defaultSort);
    const filter = { ...scopeOf(req), ...buildFilter(req.query, req) };
    const search = searchFilter(req.query.search, searchFields);
    if (search) Object.assign(filter, search);

    const [data, total] = await Promise.all([
      populated(Model.find(filter).sort(sort).skip(skip).limit(limit)).lean(),
      Model.countDocuments(filter),
    ]);
    res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await populated(Model.findOne({ _id: req.params.id, ...scopeOf(req) })).lean();
    if (!doc) throw ApiError.notFound(`${label} no encontrado`);
    res.json(doc);
  });

  const create = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (scopeField) {
      if (req.user.role !== 'admin') data[scopeField] = req.user._id;
      else if (!data[scopeField] && defaultToCreator) data[scopeField] = req.user._id;
    }
    await checkRefs(data, req);
    if (beforeCreate) await beforeCreate(data, req);
    const doc = await Model.create(data);
    const full = await populated(Model.findById(doc._id)).lean();
    res.status(201).json(full);
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, ...scopeOf(req) });
    if (!doc) throw ApiError.notFound(`${label} no encontrado`);
    const data = { ...req.body };
    if (scopeField && req.user.role !== 'admin') delete data[scopeField]; // un asesor no reasigna
    await checkRefs(data, req);
    doc.set(data);
    await doc.save(); // ejecuta validadores con el documento completo
    res.json(await populated(Model.findById(doc._id)).lean());
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, ...scopeOf(req) });
    if (!doc) throw ApiError.notFound(`${label} no encontrado`);
    if (beforeDelete) await beforeDelete(doc, req);
    await doc.deleteOne();
    if (afterDelete) await afterDelete(doc, req);
    res.json({ message: `${label} eliminado correctamente` });
  });

  return { list, getOne, create, update, remove, scopeOf };
}

module.exports = { createCrud };
