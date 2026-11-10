// Esquemas de validación (Zod). Los de actualización son versiones parciales.
const { z } = require('zod');
const { ROLES } = require('../models/User');
const { ID_TYPES, CLIENT_TYPES, CLIENT_STATUS } = require('../models/Client');
const { OPP_STATUS } = require('../models/Opportunity');
const { ACTIVITY_TYPES } = require('../models/Activity');
const { TASK_STATUS, TASK_PRIORITY } = require('../models/Task');

const text = (max = 200) => z.string().trim().max(max);
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Identificador inválido');
// Id opcional: acepta "", null o undefined y los normaliza a null.
const optObjectId = z.preprocess((v) => (v === '' || v === undefined ? null : v), z.union([z.null(), objectId]));
const optEmail = z.union([z.literal(''), z.email('Correo inválido')]).optional();
const optDate = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.union([z.null(), z.coerce.date({ message: 'Fecha inválida' })])
);
const password = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
  .regex(/\d/, 'Debe incluir al menos un número');

// --- Auth / usuarios
const register = z.object({ name: text(80).min(2), email: z.email().toLowerCase(), password });
const login = z.object({ email: z.email().toLowerCase(), password: z.string().min(1).max(200) });
const userCreate = z.object({ name: text(80).min(2), email: z.email().toLowerCase(), password, role: z.enum(ROLES).default('advisor') });
const userUpdate = z.object({
  name: text(80).min(2),
  role: z.enum(ROLES),
  active: z.boolean(),
  password,
}).partial();

// --- Empresas
const companyCreate = z.object({
  name: text(120).min(1, 'Obligatorio'),
  taxId: text(40).min(1, 'Obligatorio'),
  sector: text(80).optional(),
  email: optEmail,
  phone: text(40).optional(),
  address: text(160).optional(),
  city: text(80).optional(),
  website: text(200).optional(),
  description: text(1000).optional(),
});

// --- Clientes
const clientCreate = z.object({
  fullName: text(120).min(2, 'Obligatorio'),
  idType: z.enum(ID_TYPES),
  idNumber: text(40).min(3, 'Obligatorio'),
  email: z.email('Correo inválido').toLowerCase(),
  phone: text(40).min(5, 'Teléfono inválido'),
  address: text(160).optional(),
  city: text(80).optional(),
  company: optObjectId.optional(),
  clientType: z.enum(CLIENT_TYPES).optional(),
  status: z.enum(CLIENT_STATUS).optional(),
  assignedTo: optObjectId.optional(),
  notes: text(2000).optional(),
});

// --- Oportunidades
const opportunityCreate = z.object({
  title: text(140).min(2, 'Obligatorio'),
  client: objectId,
  company: optObjectId.optional(),
  owner: objectId.optional(),
  estimatedValue: z.coerce.number().min(0, 'No puede ser negativo').optional(),
  expectedCloseDate: optDate.optional(),
  status: z.enum(OPP_STATUS).optional(),
  description: text(2000).optional(),
});
const opportunityStatus = z.object({ status: z.enum(OPP_STATUS) });

// --- Actividades
const activityCreate = z.object({
  client: objectId,
  owner: objectId.optional(),
  type: z.enum(ACTIVITY_TYPES),
  description: text(2000).min(2, 'Obligatorio'),
  date: z.coerce.date({ message: 'Fecha inválida' }).optional(),
  result: text(1000).optional(),
  nextFollowUp: optDate.optional(),
});

// --- Tareas
const taskCreate = z.object({
  title: text(140).min(2, 'Obligatorio'),
  description: text(2000).optional(),
  assignedTo: objectId.optional(),
  client: optObjectId.optional(),
  dueDate: z.coerce.date({ message: 'Fecha inválida' }),
  priority: z.enum(TASK_PRIORITY).optional(),
  status: z.enum(TASK_STATUS).optional(),
});
const taskStatus = z.object({ status: z.enum(TASK_STATUS) });

module.exports = {
  register, login, userCreate, userUpdate,
  companyCreate, companyUpdate: companyCreate.partial(),
  clientCreate, clientUpdate: clientCreate.partial(),
  opportunityCreate, opportunityUpdate: opportunityCreate.partial(), opportunityStatus,
  activityCreate, activityUpdate: activityCreate.partial(),
  taskCreate, taskUpdate: taskCreate.partial(), taskStatus,
};
