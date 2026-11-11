# Instalación, ejecución y despliegue

> Los pasos de Atlas, Render, Vercel y GitHub dependen de interfaces de terceros que cambian con frecuencia. Si un nombre de menú no coincide, consulta la documentación oficial: https://www.mongodb.com/docs/atlas/getting-started/ · https://render.com/docs · https://vercel.com/docs

## 1–6. MongoDB Atlas
1. Crea una cuenta en mongodb.com/atlas y verifica el correo.
2. Crea un proyecto y un clúster gratuito (M0).
3. La base `crm_database` se crea sola al guardar el primer dato (las colecciones también).
4. En **Database Access** crea un usuario de base de datos (por ejemplo `crm_user`) con contraseña de solo letras y números y permiso de lectura y escritura. **No es tu correo ni la cuenta de Atlas.**
5. En **Network Access** agrega `0.0.0.0/0` (necesario para Render, que usa IPs variables).
6. En **Connect → Drivers** copia la cadena `mongodb+srv://…`, reemplaza `<db_password>` por la contraseña y agrega `/crm_database` antes del `?`.

## 7–8. Ejecución local
```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
# edita .env: MONGODB_URI y JWT_SECRET (>= 32 caracteres)
npm run db:check            # debe decir "Conexión exitosa"
npm run dev                 # API en http://localhost:4000

# en otra terminal
cd frontend
npm install
npm run dev                 # aplicación en http://localhost:5173
```
Generar `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
Con la base vacía, la pantalla de ingreso ofrece crear el **administrador inicial**. Datos de ejemplo opcionales: `npm run seed` (se borran con `npm run seed -- --reset`). Recuperar acceso: `npm run admin:reset -- correo@ejemplo.com NuevaClave123`.

## 9. GitHub
```bash
git init
git add .
git status        # verifica que NO aparezca ningún .env ni node_modules
git commit -m "feat: versión inicial del CRM"
git branch -M main
git remote add origin https://github.com/USUARIO/REPOSITORIO.git
git push -u origin main
```
Para colaborar: invitar al compañero en **Settings → Collaborators**, que cada quien trabaje en una rama (`git checkout -b feature/nombre`), suba con `git push -u origin feature/nombre` y abra un Pull Request.

## 10. Despliegue
### Backend en Render
1. En Render: **New → Web Service**, conecta el repositorio de GitHub (o usa **New → Blueprint** con el archivo `render.yaml` de la raíz).
2. **Root Directory:** `backend` · **Build Command:** `npm install` · **Start Command:** `npm start` · Health check: `/api/health`.
3. **Environment:** `NODE_ENV=production`, `MONGODB_URI` (tu cadena de Atlas), `JWT_SECRET` (el valor largo), `JWT_EXPIRES_IN=8h`, `CLIENT_URL` (se completa en el paso 5).
4. Despliega y abre `https://TU-API.onrender.com/api/health`: debe responder `{"status":"ok","database":"conectado"}`. En planes gratuitos el servicio puede "dormirse" y tardar en responder la primera vez.

### Frontend en Vercel
1. En Vercel: **Add New → Project**, importa el mismo repositorio.
2. **Root Directory:** `frontend` · Framework: Vite · Build: `npm run build` · Output: `dist`.
3. **Environment Variables:** `VITE_API_URL` = `https://TU-API.onrender.com/api` (con `/api` al final).
4. Despliega. `frontend/vercel.json` hace que las rutas internas (por ejemplo `/clientes`) funcionen al recargar.

## 11. Conectar lo desplegado
5. Vuelve a Render y define `CLIENT_URL` con la URL pública de Vercel, **sin barra final** (por ejemplo `https://tu-app.vercel.app`; varias separadas por coma). Guarda y redepliega. Sin esto el navegador recibe error de CORS.
6. Abre la URL de Vercel: con la base vacía verás "Crea el administrador".

## Lista de comprobación tras el despliegue
- [ ] `https://TU-API.onrender.com/api/health` → `ok` y `conectado`.
- [ ] La URL de Vercel muestra la pantalla de ingreso (sin error rojo de conexión).
- [ ] Se puede crear el administrador o iniciar sesión.
- [ ] Crear un cliente y verlo en **Atlas → Browse Collections → crm_database → clients**.
- [ ] Recargar una ruta interna (por ejemplo `/clientes`) no da 404.
- [ ] No hay `.env` ni credenciales en el repositorio de GitHub.

## Problemas frecuentes
| Síntoma | Causa probable |
|---|---|
| `bad auth: authentication failed` | Usuario o contraseña de la base mal escritos en `MONGODB_URI`; se usó un correo en vez del usuario de la base; contraseña con símbolos especiales |
| `server selection timed out` | Network Access de Atlas sin `0.0.0.0/0` |
| "No se pudo conectar con el servidor" en el login | Backend apagado, o `VITE_API_URL`/proxy mal configurado |
| Error de CORS / 403 "Origen no permitido" en producción | `CLIENT_URL` no coincide exactamente con la URL de Vercel |
| 404 al recargar una ruta en Vercel | Falta `frontend/vercel.json` |
