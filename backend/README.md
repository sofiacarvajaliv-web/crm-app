# Backend – API REST del CRM

Node.js + Express 4 + Mongoose 8 + MongoDB Atlas. Autenticación JWT, contraseñas con bcrypt (paquete `bcryptjs`, mismo algoritmo, sin compilación nativa).

## Requisitos
Node.js 18+ y una cuenta/clúster de MongoDB Atlas.

## Puesta en marcha local
```bash
cd backend
npm install
cp .env.example .env        # en Windows: copy .env.example .env
# edita .env: MONGODB_URI (con /crm_database) y JWT_SECRET (>= 32 caracteres)
npm run db:check            # prueba la conexión a Atlas (no imprime credenciales)
npm run dev                 # API en http://localhost:4000/api/health
```
Generar un JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Primer uso
1. Con la base vacía, `GET /api/auth/setup-status` devuelve `needsSetup: true`.
2. `POST /api/auth/register` crea el **administrador inicial** (solo funciona mientras no existan usuarios).
3. El administrador crea a los asesores con `POST /api/users`.

## Datos de demostración (opcional, separados de los reales)
```bash
npm run seed                # agrega usuarios/clientes/etc. @demo.test
npm run seed -- --reset     # borra SOLO los datos demo y los recrea
```

## Pruebas
Las pruebas **nunca** usan `MONGODB_URI`; exigen una base desechable cuyo nombre contenga "test":
```bash
MONGODB_URI_TEST="mongodb://127.0.0.1:27017/crm_test" npm test     # requiere un MongoDB local
```
(En PowerShell: `$env:MONGODB_URI_TEST="mongodb://127.0.0.1:27017/crm_test"; npm test`.)
También puedes apuntar `MONGODB_URI_TEST` a una base de Atlas de pruebas (p. ej. `.../crm_test`).

## Estructura
`src/config` · `src/models` · `src/validators` · `src/middleware` · `src/controllers` · `src/services` · `src/routes` · `src/utils` · `src/seed` · `src/tests`
