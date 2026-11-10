// Error controlado de la API: lleva código HTTP y detalles opcionales.
class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
  static badRequest(msg, details) { return new ApiError(400, msg, details); }
  static unauthorized(msg = 'No autenticado') { return new ApiError(401, msg); }
  static forbidden(msg = 'No tienes permisos para esta acción') { return new ApiError(403, msg); }
  static notFound(msg = 'Recurso no encontrado') { return new ApiError(404, msg); }
  static conflict(msg, details) { return new ApiError(409, msg, details); }
}
module.exports = ApiError;
