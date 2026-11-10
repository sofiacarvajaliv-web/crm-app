const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.set('trust proxy', 1); // detrás del proxy de Render/Vercel
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Permite herramientas sin origen (curl, Postman, pruebas) y los orígenes configurados.
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      return cb(ApiError.forbidden('Origen no permitido por CORS'));
    },
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize()); // elimina claves con "$" o "." (inyección NoSQL)
if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false, skip: () => env.isTest })
);

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
