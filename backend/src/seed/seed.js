// DATOS DE DEMOSTRACIÓN — npm run seed [-- --reset]
// Todo lo que crea queda marcado como demo (correos @demo.test, NIT "DEMO-…")
// para poder distinguirlo y borrarlo sin tocar datos reales.
//   npm run seed              → agrega los datos demo
//   npm run seed -- --reset   → borra SOLO los datos demo y los vuelve a crear
// Contraseña de los usuarios demo: variable SEED_PASSWORD (si no existe, se genera y se muestra una vez).
const crypto = require('crypto');
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Company = require('../models/Company');
const Client = require('../models/Client');
const Opportunity = require('../models/Opportunity');
const Activity = require('../models/Activity');
const Task = require('../models/Task');

const DAY = 24 * 3600 * 1000;
const ago = (d) => new Date(Date.now() - d * DAY);
const pick = (arr, i) => arr[i % arr.length];

async function resetDemo() {
  const users = await User.find({ email: /@demo\.test$/ }).select('_id');
  const clients = await Client.find({ email: /@demo\.test$/ }).select('_id');
  const uIds = users.map((u) => u._id);
  const cIds = clients.map((c) => c._id);
  await Promise.all([
    Activity.deleteMany({ $or: [{ client: { $in: cIds } }, { owner: { $in: uIds } }] }),
    Task.deleteMany({ $or: [{ client: { $in: cIds } }, { assignedTo: { $in: uIds } }] }),
    Opportunity.deleteMany({ $or: [{ client: { $in: cIds } }, { owner: { $in: uIds } }] }),
  ]);
  await Client.deleteMany({ _id: { $in: cIds } });
  await Company.deleteMany({ taxId: /^DEMO-/ });
  await User.deleteMany({ _id: { $in: uIds } });
}

(async () => {
  if (env.isProd) {
    console.error('✖ El seed no se ejecuta con NODE_ENV=production.');
    process.exit(1);
  }
  await connectDB();
  console.log(`Base de datos destino: ${mongoose.connection.name}`);
  if (process.argv.includes('--reset')) {
    await resetDemo();
    console.log('• Datos demo anteriores eliminados.');
  }
  if (await User.exists({ email: 'admin@demo.test' })) {
    console.log('Ya existen datos demo. Usa "npm run seed -- --reset" para recrearlos.');
    return mongoose.disconnect();
  }

  const generated = !process.env.SEED_PASSWORD;
  const password = process.env.SEED_PASSWORD || `Demo${crypto.randomBytes(5).toString('hex')}9`;

  const admin = await User.create({ name: 'Admin Demo', email: 'admin@demo.test', password, role: 'admin' });
  const adv = await User.create([
    { name: 'Ana Asesora (demo)', email: 'ana@demo.test', password, role: 'advisor' },
    { name: 'Luis Asesor (demo)', email: 'luis@demo.test', password, role: 'advisor' },
  ]);

  const companies = await Company.create([
    { name: 'Andina Logística S.A.S.', taxId: 'DEMO-900100100-1', sector: 'Transporte', email: 'info@andina.demo.test', city: 'Medellín', website: 'https://andina.example' },
    { name: 'Café del Valle Ltda.', taxId: 'DEMO-900200200-2', sector: 'Agroindustria', email: 'ventas@cafevalle.demo.test', city: 'Armenia' },
    { name: 'TecnoSoft Colombia', taxId: 'DEMO-900300300-3', sector: 'Tecnología', email: 'hola@tecnosoft.demo.test', city: 'Bogotá' },
  ]);

  const names = ['Carlos Ruiz', 'Marta Gómez', 'Pedro Pérez', 'Lucía Torres', 'Andrés Mejía', 'Sofía Herrera', 'Julián Castro', 'Valentina Ríos', 'Camilo Ortiz', 'Daniela Vargas', 'Esteban Cano', 'Isabel Montoya'];
  const states = ['activo', 'potencial', 'inactivo'];
  const types = ['persona', 'empresa', 'prospecto'];
  const cities = ['Medellín', 'Bogotá', 'Cali', 'Barranquilla'];
  const clients = [];
  for (let i = 0; i < names.length; i += 1) {
    clients.push(await Client.create({
      fullName: names[i], idType: 'CC', idNumber: `DEMO${1000 + i}`, email: `cliente${i + 1}@demo.test`,
      phone: `300${String(1000000 + i * 137).slice(0, 7)}`, city: pick(cities, i),
      company: i % 3 === 0 ? undefined : pick(companies, i)._id,
      clientType: pick(types, i), status: pick(states, i), assignedTo: pick(adv, i)._id,
      notes: '[DEMO] Registro de demostración', registeredAt: ago(i * 18),
    }));
  }

  const oppStatus = ['nueva', 'en_contacto', 'en_negociacion', 'ganada', 'perdida'];
  const opps = [];
  for (let i = 0; i < 10; i += 1) {
    const c = pick(clients, i);
    opps.push(await Opportunity.create({
      title: `Propuesta ${i + 1} – ${c.fullName}`, client: c._id, company: c.company, owner: c.assignedTo,
      estimatedValue: (i + 1) * 1500000, expectedCloseDate: new Date(Date.now() + (i + 3) * DAY),
      status: pick(oppStatus, i), description: '[DEMO] Oportunidad de demostración',
    }));
  }

  const actTypes = ['llamada', 'correo', 'reunion', 'visita', 'seguimiento', 'otra'];
  for (let i = 0; i < 18; i += 1) {
    const c = pick(clients, i);
    await Activity.create({
      client: c._id, owner: c.assignedTo, type: pick(actTypes, i), description: `[DEMO] Interacción ${i + 1} con ${c.fullName}`,
      date: ago(i), result: 'Resultado de demostración', nextFollowUp: i % 2 ? new Date(Date.now() + 3 * DAY) : undefined,
    });
  }

  const prio = ['alta', 'media', 'baja'];
  const tStatus = ['pendiente', 'en_progreso', 'completada'];
  for (let i = 0; i < 12; i += 1) {
    const c = pick(clients, i);
    await Task.create({
      title: `[DEMO] Tarea ${i + 1}`, assignedTo: c.assignedTo, client: c._id,
      dueDate: new Date(Date.now() + (i - 4) * DAY), priority: pick(prio, i), status: pick(tStatus, i),
    });
  }

  console.log(`✔ Datos demo creados: 3 usuarios, ${companies.length} empresas, ${clients.length} clientes, ${opps.length} oportunidades, 18 actividades, 12 tareas.`);
  console.log('  Usuarios: admin@demo.test, ana@demo.test, luis@demo.test');
  console.log(generated ? `  Contraseña generada (guárdala, no se mostrará de nuevo): ${password}` : '  Contraseña: la definida en SEED_PASSWORD');
  void admin;
  await mongoose.disconnect();
})().catch((e) => { console.error('✖ Error en el seed:', e.message); process.exit(1); });
