const ApiError = require('./ApiError');

// Fuerza que un valor de query sea string (evita inyección tipo ?status[$ne]=x).
const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

// Paginación + ordenamiento con lista blanca de campos.
function parseListQuery(query, sortable, defaultSort = '-createdAt') {
  const page = Math.max(parseInt(str(query.page), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(str(query.limit), 10) || 10, 1), 100);
  let sortParam = str(query.sort) || defaultSort;
  const desc = sortParam.startsWith('-');
  const field = sortParam.replace(/^-/, '');
  if (!sortable.includes(field)) sortParam = defaultSort;
  else sortParam = (desc ? '-' : '') + field;
  return { page, limit, skip: (page - 1) * limit, sort: sortParam };
}

// Filtro de búsqueda de texto (regex escapado, sin distinguir mayúsculas).
function searchFilter(term, fields) {
  const t = str(term);
  if (!t) return null;
  const rx = new RegExp(escapeRegex(t), 'i');
  return { $or: fields.map((f) => ({ [f]: rx })) };
}

// Valida filtros por id recibidos por query.
function idFilter(value, label) {
  const v = str(value);
  if (!v) return undefined;
  if (!isObjectId(v)) throw ApiError.badRequest(`Filtro inválido: ${label}`);
  return v;
}

module.exports = { str, escapeRegex, isObjectId, parseListQuery, searchFilter, idFilter };
