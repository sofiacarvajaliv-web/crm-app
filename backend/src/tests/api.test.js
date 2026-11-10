const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');

const api = request(app);
const DAY = 24 * 3600 * 1000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();

const admin = { name: 'Admin Test', email: 'admin@test.com', password: 'Admin12345' };
const adv1 = { name: 'Asesor Uno', email: 'asesor1@test.com', password: 'Asesor12345', role: 'advisor' };
const adv2 = { name: 'Asesor Dos', email: 'asesor2@test.com', password: 'Asesor12345', role: 'advisor' };

const tok = {}; // tokens
const id = {};  // ids creados
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const A = () => auth(tok.admin);
const V1 = () => auth(tok.adv1);

beforeAll(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init())); // crea índices únicos
});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('Conexión a la base de datos', () => {
  test('GET /api/health informa conexión activa', async () => {
    const res = await api.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'conectado' });
  });
});

describe('Autenticación', () => {
  test('setup-status indica que falta el administrador inicial', async () => {
    expect((await api.get('/api/auth/setup-status')).body.needsSetup).toBe(true);
  });

  test('rechaza contraseña débil en el registro', async () => {
    const res = await api.post('/api/auth/register').send({ ...admin, password: 'abc' });
    expect(res.status).toBe(400);
  });

  test('registra el administrador inicial y devuelve token sin contraseña', async () => {
    const res = await api.post('/api/auth/register').send(admin);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('admin');
    expect(res.body.user.password).toBeUndefined();
    tok.admin = res.body.token;
    id.admin = res.body.user._id;
  });

  test('la contraseña se guarda cifrada con bcrypt', async () => {
    const u = await User.findOne({ email: admin.email }).select('+password');
    expect(u.password).not.toBe(admin.password);
    expect(u.password).toMatch(/^\$2[aby]\$/);
  });

  test('el registro público se bloquea cuando ya existe un usuario', async () => {
    const res = await api.post('/api/auth/register').send({ ...admin, email: 'otro@test.com' });
    expect(res.status).toBe(403);
    expect((await api.get('/api/auth/setup-status')).body.needsSetup).toBe(false);
  });

  test('login correcto', async () => {
    const res = await api.post('/api/auth/login').send({ email: admin.email, password: admin.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  test('login con contraseña incorrecta o correo inexistente → 401', async () => {
    expect((await api.post('/api/auth/login').send({ email: admin.email, password: 'Incorrecta1' })).status).toBe(401);
    expect((await api.post('/api/auth/login').send({ email: 'no@test.com', password: 'Incorrecta1' })).status).toBe(401);
  });

  test('bloquea inyección NoSQL en el login', async () => {
    const res = await api.post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } });
    expect(res.status).toBe(400);
  });
});

describe('Protección de rutas', () => {
  test('sin token → 401', async () => {
    for (const path of ['/api/clients', '/api/companies', '/api/opportunities', '/api/activities', '/api/tasks', '/api/dashboard/summary', '/api/users']) {
      expect((await api.get(path)).status).toBe(401);
    }
  });
  test('token inválido → 401', async () => {
    expect((await api.get('/api/clients').set(auth('token.falso.aqui'))).status).toBe(401);
  });
  test('token válido permite /auth/me', async () => {
    const res = await api.get('/api/auth/me').set(A());
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(admin.email);
  });
});

describe('Usuarios y roles', () => {
  test('el admin crea asesores', async () => {
    const r1 = await api.post('/api/users').set(A()).send(adv1);
    const r2 = await api.post('/api/users').set(A()).send(adv2);
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    id.adv1 = r1.body._id;
    id.adv2 = r2.body._id;
    tok.adv1 = (await api.post('/api/auth/login').send({ email: adv1.email, password: adv1.password })).body.token;
    tok.adv2 = (await api.post('/api/auth/login').send({ email: adv2.email, password: adv2.password })).body.token;
    expect(tok.adv1 && tok.adv2).toBeTruthy();
  });
  test('correo duplicado → 409', async () => {
    expect((await api.post('/api/users').set(A()).send(adv1)).status).toBe(409);
  });
  test('un asesor no puede gestionar usuarios → 403', async () => {
    expect((await api.get('/api/users').set(V1())).status).toBe(403);
    expect((await api.post('/api/users').set(V1()).send({ ...adv1, email: 'x@test.com' })).status).toBe(403);
  });
  test('un usuario desactivado ya no puede usar su token', async () => {
    const tmp = await api.post('/api/users').set(A()).send({ name: 'Temporal', email: 'tmp@test.com', password: 'Temporal123' });
    const t = (await api.post('/api/auth/login').send({ email: 'tmp@test.com', password: 'Temporal123' })).body.token;
    expect((await api.delete(`/api/users/${tmp.body._id}`).set(A())).status).toBe(200);
    expect((await api.get('/api/auth/me').set(auth(t))).status).toBe(401);
  });
  test('el admin no puede desactivarse a sí mismo', async () => {
    expect((await api.delete(`/api/users/${id.admin}`).set(A())).status).toBe(400);
  });
});

describe('Empresas', () => {
  const company = { name: 'Andina Logística', taxId: '900123456-7', sector: 'Transporte', email: 'info@andina.co', city: 'Medellín' };
  test('crear empresa', async () => {
    const res = await api.post('/api/companies').set(A()).send(company);
    expect(res.status).toBe(201);
    id.company = res.body._id;
  });
  test('NIT duplicado → 409', async () => {
    expect((await api.post('/api/companies').set(A()).send(company)).status).toBe(409);
  });
  test('validación: nombre obligatorio → 400', async () => {
    expect((await api.post('/api/companies').set(A()).send({ taxId: '1' })).status).toBe(400);
  });
  test('consultar, buscar y editar', async () => {
    expect((await api.get(`/api/companies/${id.company}`).set(A())).body.name).toBe('Andina Logística');
    const search = await api.get('/api/companies?search=andina').set(A());
    expect(search.body.total).toBe(1);
    const upd = await api.put(`/api/companies/${id.company}`).set(A()).send({ sector: 'Logística' });
    expect(upd.status).toBe(200);
    expect(upd.body.sector).toBe('Logística');
  });
  test('id inválido → 400 y no existente → 404', async () => {
    expect((await api.get('/api/companies/123').set(A())).status).toBe(400);
    expect((await api.get(`/api/companies/${new mongoose.Types.ObjectId()}`).set(A())).status).toBe(404);
  });
  test('un asesor no puede eliminar empresas → 403', async () => {
    expect((await api.delete(`/api/companies/${id.company}`).set(V1())).status).toBe(403);
  });
});

describe('Clientes', () => {
  const base = { idType: 'CC', phone: '3001234567', city: 'Medellín' };

  test('el admin crea un cliente asignado a un asesor y con empresa', async () => {
    const res = await api.post('/api/clients').set(A()).send({
      ...base, fullName: 'Carlos Ruiz', idNumber: '1020304050', email: 'Carlos@Andina.co',
      company: id.company, assignedTo: id.adv1, status: 'activo', clientType: 'persona',
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('carlos@andina.co'); // normalizado a minúsculas
    expect(res.body.company.name).toBe('Andina Logística');
    id.c1 = res.body._id;
  });

  test('un asesor crea un cliente: se le asigna a sí mismo aunque envíe otro responsable', async () => {
    const res = await api.post('/api/clients').set(V1()).send({
      ...base, fullName: 'Marta Gómez', idNumber: '555111', email: 'marta@mail.com', assignedTo: id.adv2, status: 'potencial',
    });
    expect(res.status).toBe(201);
    expect(res.body.assignedTo._id).toBe(id.adv1);
    id.c2 = res.body._id;
  });

  test('crea clientes adicionales (asesor 2 y sin asignar)', async () => {
    const c3 = await api.post('/api/clients').set(A()).send({
      ...base, fullName: 'Pedro Pérez', idNumber: '777222', email: 'pedro@mail.com', assignedTo: id.adv2, status: 'inactivo', clientType: 'empresa',
    });
    const c4 = await api.post('/api/clients').set(A()).send({
      ...base, fullName: 'Lucía Torres', idNumber: '888333', email: 'lucia@mail.com', status: 'potencial', clientType: 'prospecto',
    });
    expect(c3.status).toBe(201);
    expect(c4.status).toBe(201);
    id.c3 = c3.body._id;
    id.c4 = c4.body._id;
  });

  test('evita duplicados de identificación y de correo → 409', async () => {
    const dupId = await api.post('/api/clients').set(A()).send({ ...base, fullName: 'X Y', idNumber: '1020304050', email: 'nuevo@mail.com' });
    const dupMail = await api.post('/api/clients').set(A()).send({ ...base, fullName: 'X Y', idNumber: '999', email: 'carlos@andina.co' });
    expect(dupId.status).toBe(409);
    expect(dupMail.status).toBe(409);
  });

  test('validaciones: correo inválido y empresa inexistente → 400', async () => {
    const bad = await api.post('/api/clients').set(A()).send({ ...base, fullName: 'Ana', idNumber: '123456', email: 'no-es-correo' });
    expect(bad.status).toBe(400);
    expect(bad.body.details[0].field).toBe('email');
    const ghost = await api.post('/api/clients').set(A()).send({
      ...base, fullName: 'Ana', idNumber: '123456', email: 'ana@mail.com', company: String(new mongoose.Types.ObjectId()),
    });
    expect(ghost.status).toBe(400);
  });

  test('búsqueda por nombre, correo e identificación', async () => {
    expect((await api.get('/api/clients?search=ruiz').set(A())).body.total).toBe(1);
    expect((await api.get('/api/clients?search=marta@mail').set(A())).body.total).toBe(1);
    expect((await api.get('/api/clients?search=777222').set(A())).body.total).toBe(1);
    expect((await api.get('/api/clients?search=zzzz').set(A())).body.total).toBe(0);
  });

  test('filtros por estado y tipo', async () => {
    expect((await api.get('/api/clients?status=potencial').set(A())).body.total).toBe(2);
    expect((await api.get('/api/clients?status=activo').set(A())).body.total).toBe(1);
    expect((await api.get('/api/clients?clientType=empresa').set(A())).body.total).toBe(1);
    expect((await api.get('/api/clients?status=potencial&clientType=prospecto').set(A())).body.total).toBe(1);
  });

  test('paginación y ordenamiento', async () => {
    const p1 = await api.get('/api/clients?limit=3&page=1&sort=fullName').set(A());
    expect(p1.body).toMatchObject({ page: 1, limit: 3, total: 4, totalPages: 2 });
    expect(p1.body.data.map((c) => c.fullName)).toEqual(['Carlos Ruiz', 'Lucía Torres', 'Marta Gómez']);
    const p2 = await api.get('/api/clients?limit=3&page=2&sort=fullName').set(A());
    expect(p2.body.data).toHaveLength(1);
    const desc = await api.get('/api/clients?sort=-fullName').set(A());
    expect(desc.body.data[0].fullName).toBe('Pedro Pérez');
  });

  test('un parámetro de consulta malicioso no se interpreta como operador', async () => {
    const res = await api.get('/api/clients?status[$ne]=x').set(A());
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(4);
  });

  test('un asesor solo ve sus clientes y no accede a los ajenos', async () => {
    const list = await api.get('/api/clients').set(V1());
    expect(list.body.total).toBe(2);
    expect((await api.get(`/api/clients/${id.c3}`).set(V1())).status).toBe(404);
    expect((await api.put(`/api/clients/${id.c3}`).set(V1()).send({ city: 'Cali' })).status).toBe(404);
  });

  test('editar cliente', async () => {
    const res = await api.put(`/api/clients/${id.c1}`).set(A()).send({ city: 'Bogotá', notes: 'VIP' });
    expect(res.status).toBe(200);
    expect(res.body.city).toBe('Bogotá');
  });

  test('un asesor no puede reasignar el responsable de un cliente', async () => {
    const res = await api.put(`/api/clients/${id.c2}`).set(V1()).send({ assignedTo: id.adv2 });
    expect(res.status).toBe(200);
    expect(res.body.assignedTo._id).toBe(id.adv1);
  });

  test('contactos de la empresa', async () => {
    const res = await api.get(`/api/companies/${id.company}/contacts`).set(A());
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].fullName).toBe('Carlos Ruiz');
  });

  test('un asesor no puede eliminar clientes → 403', async () => {
    expect((await api.delete(`/api/clients/${id.c2}`).set(V1())).status).toBe(403);
  });
});

describe('Oportunidades', () => {
  test('crear oportunidad: hereda la empresa del cliente', async () => {
    const res = await api.post('/api/opportunities').set(A()).send({
      title: 'Contrato anual', client: id.c1, owner: id.adv1, estimatedValue: 1000, expectedCloseDate: iso(30), status: 'en_contacto',
    });
    expect(res.status).toBe(201);
    expect(res.body.company.name).toBe('Andina Logística');
    id.o1 = res.body._id;
  });

  test('el asesor crea la suya (owner forzado) y otras para completar el escenario', async () => {
    const o2 = await api.post('/api/opportunities').set(V1()).send({ title: 'Plan básico', client: id.c2, estimatedValue: 500, owner: id.adv2 });
    expect(o2.status).toBe(201);
    expect(o2.body.owner._id).toBe(id.adv1);
    expect(o2.body.status).toBe('nueva');
    id.o2 = o2.body._id;
    const o3 = await api.post('/api/opportunities').set(A()).send({ title: 'Gran cuenta', client: id.c3, owner: id.adv2, estimatedValue: 2000, status: 'ganada' });
    const o4 = await api.post('/api/opportunities').set(A()).send({ title: 'Cuenta perdida', client: id.c3, owner: id.adv2, estimatedValue: 300, status: 'perdida' });
    expect(o3.status).toBe(201);
    expect(o4.status).toBe(201);
    id.o3 = o3.body._id;
  });

  test('validaciones: valor negativo, estado inválido, cliente ajeno para un asesor', async () => {
    expect((await api.post('/api/opportunities').set(A()).send({ title: 'Mala', client: id.c1, estimatedValue: -5 })).status).toBe(400);
    expect((await api.post('/api/opportunities').set(A()).send({ title: 'Mala', client: id.c1, status: 'inventado' })).status).toBe(400);
    expect((await api.post('/api/opportunities').set(V1()).send({ title: 'Ajena', client: id.c3 })).status).toBe(400);
  });

  test('cambiar estado (Kanban) y consultar por estado', async () => {
    const res = await api.patch(`/api/opportunities/${id.o1}/status`).set(V1()).send({ status: 'en_negociacion' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('en_negociacion');
    expect((await api.get('/api/opportunities?status=en_negociacion').set(A())).body.total).toBe(1);
    expect((await api.patch(`/api/opportunities/${id.o1}/status`).set(V1()).send({ status: 'xx' })).status).toBe(400);
  });

  test('editar y alcance por rol', async () => {
    const upd = await api.put(`/api/opportunities/${id.o2}`).set(V1()).send({ estimatedValue: 500, description: 'Seguimiento' });
    expect(upd.status).toBe(200);
    expect((await api.get('/api/opportunities').set(V1())).body.total).toBe(2);
    expect((await api.get('/api/opportunities').set(A())).body.total).toBe(4);
    expect((await api.get(`/api/opportunities/${id.o3}`).set(V1())).status).toBe(404);
  });

  test('no se elimina un cliente ni una empresa con oportunidades/contactos → 409', async () => {
    const c = await api.delete(`/api/clients/${id.c1}`).set(A());
    expect(c.status).toBe(409);
    expect(c.body.message).toMatch(/oportunidad/);
    expect((await api.delete(`/api/companies/${id.company}`).set(A())).status).toBe(409);
  });
});

describe('Actividades', () => {
  test('registrar actividades', async () => {
    const a1 = await api.post('/api/activities').set(V1()).send({ client: id.c1, type: 'llamada', description: 'Primera llamada', date: iso(-3), result: 'Interesado', nextFollowUp: iso(4) });
    const a2 = await api.post('/api/activities').set(V1()).send({ client: id.c1, type: 'reunion', description: 'Reunión de propuesta', date: iso(-1) });
    expect(a1.status).toBe(201);
    expect(a2.status).toBe(201);
    expect(a1.body.owner._id).toBe(id.adv1);
    id.a1 = a1.body._id;
  });
  test('validaciones: tipo inválido y seguimiento anterior a la fecha', async () => {
    expect((await api.post('/api/activities').set(V1()).send({ client: id.c1, type: 'telepatia', description: 'x1' })).status).toBe(400);
    const res = await api.post('/api/activities').set(V1()).send({ client: id.c1, type: 'llamada', description: 'Fecha mala', date: iso(0), nextFollowUp: iso(-10) });
    expect(res.status).toBe(400);
  });
  test('historial del cliente (más reciente primero) y filtros', async () => {
    const h = await api.get(`/api/clients/${id.c1}/activities`).set(V1());
    expect(h.status).toBe(200);
    expect(h.body.total).toBe(2);
    expect(h.body.data[0].type).toBe('reunion');
    expect((await api.get('/api/activities?type=llamada').set(A())).body.total).toBe(1);
    expect((await api.get(`/api/clients/${id.c3}/activities`).set(V1())).status).toBe(404);
  });
  test('editar actividad', async () => {
    const res = await api.put(`/api/activities/${id.a1}`).set(V1()).send({ result: 'Pidió cotización' });
    expect(res.body.result).toBe('Pidió cotización');
  });
});

describe('Tareas', () => {
  test('crear tareas (vencida, futura y completada)', async () => {
    const t1 = await api.post('/api/tasks').set(V1()).send({ title: 'Enviar cotización', dueDate: iso(-2), priority: 'alta', client: id.c1 });
    const t2 = await api.post('/api/tasks').set(V1()).send({ title: 'Llamar la próxima semana', dueDate: iso(7), priority: 'baja', status: 'en_progreso' });
    const t3 = await api.post('/api/tasks').set(V1()).send({ title: 'Tarea vieja ya hecha', dueDate: iso(-5), status: 'completada' });
    expect([t1.status, t2.status, t3.status]).toEqual([201, 201, 201]);
    expect(t1.body.assignedTo._id).toBe(id.adv1);
    expect(t1.body.status).toBe('pendiente');
    id.t1 = t1.body._id;
  });
  test('consultar tareas vencidas (excluye completadas)', async () => {
    const res = await api.get('/api/tasks?overdue=true').set(V1());
    expect(res.body.total).toBe(1);
    expect(res.body.data[0].title).toBe('Enviar cotización');
  });
  test('filtros por prioridad y estado', async () => {
    expect((await api.get('/api/tasks?priority=alta').set(V1())).body.total).toBe(1);
    expect((await api.get('/api/tasks?status=completada').set(V1())).body.total).toBe(1);
    expect((await api.get('/api/tasks?status=en_progreso&priority=baja').set(V1())).body.total).toBe(1);
  });
  test('el admin filtra por responsable; el asesor 2 no ve tareas ajenas', async () => {
    expect((await api.get(`/api/tasks?assignedTo=${id.adv1}`).set(A())).body.total).toBe(3);
    expect((await api.get('/api/tasks').set(auth(tok.adv2))).body.total).toBe(0);
  });
  test('cambiar estado y editar', async () => {
    const st = await api.patch(`/api/tasks/${id.t1}/status`).set(V1()).send({ status: 'en_progreso' });
    expect(st.body.status).toBe('en_progreso');
    const back = await api.patch(`/api/tasks/${id.t1}/status`).set(V1()).send({ status: 'pendiente' });
    expect(back.status).toBe(200);
    expect((await api.put(`/api/tasks/${id.t1}`).set(V1()).send({ priority: 'media' })).body.priority).toBe('media');
  });
  test('validación: fecha límite obligatoria', async () => {
    expect((await api.post('/api/tasks').set(V1()).send({ title: 'Sin fecha' })).status).toBe(400);
  });
});

describe('Dashboard (indicadores calculados desde la base de datos)', () => {
  test('vista del administrador', async () => {
    const res = await api.get('/api/dashboard/summary').set(A());
    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({
      totalClients: 4, newClients: 4, openOpportunities: 2, wonOpportunities: 1, lostOpportunities: 1, pendingTasks: 2, overdueTasks: 1,
    });
    expect(res.body.performance).toEqual({ wonValue: 2000, pipelineValue: 1500, winRate: 50 });
    expect(res.body.opportunitiesByStatus).toHaveLength(5);
    expect(res.body.opportunitiesByStatus.find((s) => s.status === 'en_negociacion')).toMatchObject({ count: 1, value: 1000 });
    expect(res.body.clientsByMonth).toHaveLength(6);
    expect(res.body.clientsByMonth[5].count).toBe(4); // mes actual
    expect(res.body.recentActivities).toHaveLength(2);
  });
  test('vista del asesor: solo sus datos', async () => {
    const res = await api.get('/api/dashboard/summary').set(V1());
    expect(res.body.totals).toMatchObject({ totalClients: 2, openOpportunities: 2, wonOpportunities: 0, pendingTasks: 2 });
    expect(res.body.performance.winRate).toBe(0);
  });
  test('los indicadores cambian cuando cambian los datos', async () => {
    await api.patch(`/api/opportunities/${id.o2}/status`).set(V1()).send({ status: 'ganada' });
    const res = await api.get('/api/dashboard/summary').set(A());
    expect(res.body.totals).toMatchObject({ openOpportunities: 1, wonOpportunities: 2 });
    expect(res.body.performance).toMatchObject({ wonValue: 2500, winRate: 66.7 });
  });
});

describe('Eliminación e integridad', () => {
  test('eliminar cliente sin oportunidades borra también sus actividades y tareas', async () => {
    const c = await api.post('/api/clients').set(A()).send({ idType: 'CC', phone: '3000000000', fullName: 'Temporal Borrar', idNumber: '4040404', email: 'borrar@mail.com' });
    await api.post('/api/activities').set(A()).send({ client: c.body._id, type: 'otra', description: 'Nota temporal' });
    await api.post('/api/tasks').set(A()).send({ title: 'Tarea temporal', dueDate: iso(1), client: c.body._id });
    const del = await api.delete(`/api/clients/${c.body._id}`).set(A());
    expect(del.status).toBe(200);
    expect((await api.get(`/api/clients/${c.body._id}`).set(A())).status).toBe(404);
    expect(await Activity.countDocuments({ client: c.body._id })).toBe(0);
    expect(await Task.countDocuments({ client: c.body._id })).toBe(0);
  });
  test('eliminar oportunidad, tarea y actividad; luego empresa sin vínculos', async () => {
    expect((await api.delete(`/api/opportunities/${id.o3}`).set(A())).status).toBe(200);
    expect((await api.delete(`/api/tasks/${id.t1}`).set(V1())).status).toBe(200);
    expect((await api.delete(`/api/activities/${id.a1}`).set(V1())).status).toBe(200);
    const co = await api.post('/api/companies').set(A()).send({ name: 'Vacía S.A.', taxId: '800000000-1' });
    expect((await api.delete(`/api/companies/${co.body._id}`).set(A())).status).toBe(200);
  });
});

describe('Manejo de errores', () => {
  test('origen no permitido por CORS → 403 (no 500) y origen permitido → 200', async () => {
    const bad = await api.get('/api/health').set('Origin', 'https://sitio-malicioso.example');
    expect(bad.status).toBe(403);
    const good = await api.get('/api/health').set('Origin', 'http://localhost:5173');
    expect(good.status).toBe(200);
    expect(good.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  test('ruta inexistente → 404 y JSON malformado → 400', async () => {
    expect((await api.get('/api/no-existe').set(A())).status).toBe(404);
    const bad = await api.post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(bad.status).toBe(400);
  });
});
