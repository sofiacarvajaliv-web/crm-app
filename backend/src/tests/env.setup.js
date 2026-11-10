// Configuración de entorno SOLO para pruebas. Nunca usa MONGODB_URI (Atlas):
// exige una base desechable en MONGODB_URI_TEST cuyo nombre contenga "test".
process.env.NODE_ENV = 'test';
const uri = process.env.MONGODB_URI_TEST;
if (!uri) {
  throw new Error('Define MONGODB_URI_TEST (ej. mongodb://127.0.0.1:27017/crm_test) para ejecutar las pruebas.');
}
const dbName = new URL(uri).pathname.replace('/', '');
if (!/test/i.test(dbName)) {
  throw new Error('Por seguridad, el nombre de la base de pruebas debe contener "test".');
}
process.env.MONGODB_URI = uri;
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
