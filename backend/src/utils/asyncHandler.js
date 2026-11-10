// Envuelve controladores async para delegar errores al middleware central.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
