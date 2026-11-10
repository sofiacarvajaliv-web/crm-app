// Carga y valida las variables de entorno. Nunca imprime valores sensibles.
require('dotenv').config({ quiet: true });

const isTest = process.env.NODE_ENV === 'test';
const isProd = process.env.NODE_ENV === 'production';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia backend/.env.example a backend/.env y complétala.`
    );
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isTest,
  isProd,
  port: Number(process.env.PORT) || 4000,
  mongoUri: required('MONGODB_URI'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean),
};

if (!isTest && env.jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres.');
}

module.exports = env;
