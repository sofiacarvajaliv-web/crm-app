// Recupera el acceso de un usuario (por ejemplo, el administrador que olvidó su contraseña).
// Uso:  npm run admin:reset -- correo@ejemplo.com NuevaClave123
// Reactiva la cuenta si estaba desactivada. No imprime contraseñas ni la cadena de conexión.
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');

(async () => {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Uso: npm run admin:reset -- correo@ejemplo.com NuevaClave123');
    process.exit(1);
  }
  if (password.length < 8 || password.length > 72 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error('✖ La contraseña debe tener entre 8 y 72 caracteres, con letras y números.');
    process.exit(1);
  }
  try {
    await connectDB();
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.error(`✖ No existe un usuario con el correo "${email}".`);
      process.exitCode = 1;
    } else {
      user.password = password; // el hook pre-save la cifra con bcrypt
      user.active = true;
      await user.save();
      console.log(`✔ Contraseña restablecida para ${user.email} (rol: ${user.role}).`);
    }
  } catch (err) {
    console.error('✖ Error:', err.message.replace(/\/\/[^@]+@/, '//***:***@'));
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
