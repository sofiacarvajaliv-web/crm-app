const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');

(async () => {
  try {
    await connectDB();
    console.log('✔ Conectado a MongoDB');
    app.listen(env.port, () => console.log(`✔ API escuchando en el puerto ${env.port}`));
  } catch (err) {
    console.error('✖ No se pudo iniciar el servidor:', err.message);
    process.exit(1);
  }
})();
