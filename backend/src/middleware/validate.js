const ApiError = require('../utils/ApiError');
const { isObjectId } = require('../utils/query');

// Valida req.body con un esquema Zod y reemplaza el body por los datos limpios
// (los campos desconocidos se descartan: evita asignación masiva).
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('Datos inválidos', details));
  }
  req.body = result.data;
  next();
};

const validateId = (req, res, next) =>
  isObjectId(req.params.id) ? next() : next(ApiError.badRequest('Identificador inválido'));

module.exports = { validate, validateId };
