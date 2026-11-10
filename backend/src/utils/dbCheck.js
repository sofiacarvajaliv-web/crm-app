// Prueba de conexión: npm run db:check
// Nunca imprime la cadena de conexión ni credenciales.
const mongoose = require('mongoose');
const env = require('../config/env');
const { connectDB } = require('../config/db');

(async () => {
  try {
    await connectDB();
    await mongoose.connection.db.admin().command({ ping: 1 });
    const cols = await mongoose.connection.db.listCollections().toArray();
    console.log('✔ Conexión exitosa a MongoDB');
    console.log(`  Base de datos : ${mongoose.connection.name}`);
    console.log(`  Colecciones   : ${cols.length ? cols.map((c) => c.name).join(', ') : '(aún no hay; se crean al guardar datos)'}`);
    if (mongoose.connection.name !== 'crm_database') {
      console.log('  ⚠ El nombre de la base no es "crm_database". Revisa tu MONGODB_URI.');
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('✖ Falló la conexión:', err.name, '-', err.message.replace(/\/\/[^@]+@/, '//***:***@'));
    const m = err.message.toLowerCase();
    if (m.includes('bad auth') || m.includes('authentication failed'))
      console.error('  → Usuario o contraseña incorrectos (revisa Database Access en Atlas).');
    else if (m.includes('enotfound') || m.includes('querysrv'))
      console.error('  → No se resolvió el host. Revisa la cadena de conexión y tu internet.');
    else if (m.includes('server selection') || m.includes('timed out'))
      console.error('  → Tiempo agotado. Revisa Network Access en Atlas (tu IP o 0.0.0.0/0).');
    process.exit(1);
  }
})();
