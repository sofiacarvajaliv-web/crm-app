const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));

// Manejo centralizado de errores: respuesta uniforme { message, details }.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    message = 'Datos inválidos';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Valor inválido para ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'campo';
    message = `Ya existe un registro con el mismo valor de "${field}"`;
    details = [{ field, message }];
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'JSON inválido';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Solicitud demasiado grande';
  }

  if (status >= 500) {
    if (!env.isTest) console.error(err);
    message = 'Error interno del servidor';
    details = undefined;
  }
  res.status(status).json({ message, ...(details ? { details } : {}) });
};

module.exports = { notFound, errorHandler };
