const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const env = require('../config/env');
const { protect, authorize } = require('../middleware/auth');
const { validate, validateId } = require('../middleware/validate');
const s = require('../validators/schemas');

const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const clients = require('../controllers/clientController');
const companies = require('../controllers/companyController');
const opportunities = require('../controllers/opportunityController');
const activities = require('../controllers/activityController');
const tasks = require('../controllers/taskController');
const dashboard = require('../controllers/dashboardController');

// Estado del servicio y de la conexión a MongoDB (público, sin datos sensibles).
router.get('/health', (req, res) => {
  const states = ['desconectado', 'conectado', 'conectando', 'desconectando'];
  const state = mongoose.connection.readyState;
  res.status(state === 1 ? 200 : 503).json({ status: state === 1 ? 'ok' : 'error', database: states[state] });
});

// --- Autenticación (con límite de intentos)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { message: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});
router.get('/auth/setup-status', auth.setupStatus);
router.post('/auth/register', authLimiter, validate(s.register), auth.register);
router.post('/auth/login', authLimiter, validate(s.login), auth.login);
router.get('/auth/me', protect, auth.me);

// Todo lo demás exige sesión.
router.use(protect);

// --- Usuarios
router.get('/users/options', users.options);
router.get('/users', authorize('admin'), users.list);
router.post('/users', authorize('admin'), validate(s.userCreate), users.create);
router.put('/users/:id', authorize('admin'), validateId, validate(s.userUpdate), users.update);
router.delete('/users/:id', authorize('admin'), validateId, users.deactivate);

// --- Clientes
router.get('/clients', clients.list);
router.post('/clients', validate(s.clientCreate), clients.create);
router.get('/clients/:id', validateId, clients.getOne);
router.put('/clients/:id', validateId, validate(s.clientUpdate), clients.update);
router.delete('/clients/:id', authorize('admin'), validateId, clients.remove);
router.get('/clients/:id/activities', validateId, clients.history);

// --- Empresas
router.get('/companies', companies.list);
router.post('/companies', validate(s.companyCreate), companies.create);
router.get('/companies/:id', validateId, companies.getOne);
router.put('/companies/:id', validateId, validate(s.companyUpdate), companies.update);
router.delete('/companies/:id', authorize('admin'), validateId, companies.remove);
router.get('/companies/:id/contacts', validateId, companies.contacts);

// --- Oportunidades
router.get('/opportunities', opportunities.list);
router.post('/opportunities', validate(s.opportunityCreate), opportunities.create);
router.get('/opportunities/:id', validateId, opportunities.getOne);
router.put('/opportunities/:id', validateId, validate(s.opportunityUpdate), opportunities.update);
router.patch('/opportunities/:id/status', validateId, validate(s.opportunityStatus), opportunities.changeStatus);
router.delete('/opportunities/:id', validateId, opportunities.remove);

// --- Actividades
router.get('/activities', activities.list);
router.post('/activities', validate(s.activityCreate), activities.create);
router.get('/activities/:id', validateId, activities.getOne);
router.put('/activities/:id', validateId, validate(s.activityUpdate), activities.update);
router.delete('/activities/:id', validateId, activities.remove);

// --- Tareas
router.get('/tasks', tasks.list);
router.post('/tasks', validate(s.taskCreate), tasks.create);
router.get('/tasks/:id', validateId, tasks.getOne);
router.put('/tasks/:id', validateId, validate(s.taskUpdate), tasks.update);
router.patch('/tasks/:id/status', validateId, validate(s.taskStatus), tasks.changeStatus);
router.delete('/tasks/:id', validateId, tasks.remove);

// --- Dashboard
router.get('/dashboard/summary', dashboard.summary);

module.exports = router;
