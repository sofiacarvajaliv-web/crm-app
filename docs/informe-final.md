# Informe final – NexoCRM

## 1. Qué se desarrolló
Una aplicación web CRM con arquitectura cliente-servidor: frontend en React (Vite, Tailwind CSS, React Router, Axios, Recharts), API REST en Node.js/Express con Mongoose, autenticación JWT, contraseñas con bcrypt y base de datos documental MongoDB Atlas (`crm_database`). Incluye seis módulos con operaciones completas (crear, consultar, editar, eliminar), búsqueda, filtros, orden y paginación, más un panel con indicadores calculados desde la base de datos.

## 2. Cómo funciona cada módulo
- **Acceso y usuarios:** con la base vacía se crea el administrador inicial; después solo el administrador crea cuentas. Roles: *administrador* (todo) y *asesor comercial* (solo sus registros). Las cuentas se desactivan, no se borran.
- **Panel:** clientes totales y nuevos (30 días), oportunidades abiertas/ganadas/perdidas, tareas pendientes y vencidas, valor ganado y en negociación, tasa de cierre, clientes por mes, oportunidades por estado y actividad reciente.
- **Clientes:** registro con identificación y correo únicos, búsqueda por nombre/correo/identificación, filtros por tipo y estado, historial de actividades y botón para registrar una actividad desde el historial.
- **Empresas:** registro con NIT único, consulta de contactos (clientes asociados) y asociación o desasociación de contactos.
- **Oportunidades:** tablero Kanban de cinco estados (arrastrar y soltar o selector en la tarjeta), valor estimado, fecha de cierre, responsable.
- **Actividades:** llamadas, correos, reuniones, visitas, seguimientos u otras, con resultado y próximo seguimiento; filtros por tipo, cliente y rango de fechas.
- **Tareas:** prioridad, estado, fecha límite, responsable, cliente relacionado, filtro de vencidas; la campana de la barra superior resume lo pendiente y enlaza a las vencidas.

## 3. Cómo se conecta el frontend con el backend
El frontend usa un cliente Axios (`frontend/src/services/api.js`) que adjunta el JWT en `Authorization: Bearer` y cierra la sesión ante un 401. En desarrollo, Vite redirige `/api` a `http://localhost:4000` (proxy); en producción la variable `VITE_API_URL` apunta a la URL del backend en Render y el backend acepta únicamente los orígenes de `CLIENT_URL` (CORS).

## 4. Cómo se conecta el backend con MongoDB Atlas
`backend/src/config/db.js` usa Mongoose con la cadena `MONGODB_URI` (variable de entorno, nunca en el código). `npm run db:check` prueba la conexión sin mostrar credenciales y `/api/health` expone el estado de la conexión.

## 5. Colecciones creadas
`users`, `clients`, `companies`, `opportunities`, `activities`, `tasks`, con referencias `ObjectId` entre ellas, validaciones, índices y fechas de creación/actualización. Detalle y ejemplos en `modelo-datos.md`.

## 6. Pruebas ejecutadas y resultados
60/60 pruebas del backend (Jest + Supertest) y 76/76 comprobaciones de interfaz en Chromium (Playwright), `npm audit` sin vulnerabilidades en producción. Todo se ejecutó contra una base MongoDB local desechable; detalle, límites y errores corregidos en `pruebas.md`.

## 7. Configuraciones externas pendientes (a cargo del equipo)
- Verificar la conexión a **MongoDB Atlas** (`npm run db:check`) con las credenciales propias.
- Crear el servicio en **Render** y el proyecto en **Vercel**, cargar las variables de entorno y completar la lista de comprobación de `despliegue.md`.
- Crear el repositorio en **GitHub**, subir el proyecto y registrar a los colaboradores.
- Completar con los nombres de los integrantes, el nombre definitivo del sistema y las capturas de pantalla que pida la evaluación.
- Los diagramas están escritos en Mermaid (se visualizan automáticamente en GitHub); si la entrega los exige como imagen, expórtalos.

## 8. Cómo ejecutar el proyecto
Ver `despliegue.md` (secciones 7–8) y el `README.md` de la raíz.

## 9. Cómo publicarlo en GitHub
Ver `despliegue.md` (sección 9).

## Limitaciones conocidas
Sin recuperación de contraseña por correo (existe `npm run admin:reset`), sin verificación en dos pasos, sin registro de auditoría, sin envío real de correos, el tablero Kanban muestra hasta 100 oportunidades a la vez, y el token de sesión se guarda en `localStorage` (ver `seguridad.md`).

## Fuentes oficiales consultadas como referencia
Se citan como referencia las documentaciones oficiales; los enlaces no se abrieron durante la generación de este documento, por lo que conviene verificarlos antes de entregar.
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/ · Modelado de datos: https://www.mongodb.com/docs/manual/data-modeling/
- Mongoose: https://mongoosejs.com/docs/guide.html
- Express: https://expressjs.com/ · Seguridad: https://expressjs.com/en/advanced/best-practice-security.html
- Node.js: https://nodejs.org/en/docs
- React: https://react.dev/ · Vite: https://vite.dev/guide/ · Tailwind CSS: https://tailwindcss.com/docs · Recharts: https://recharts.org/
- Zod: https://zod.dev/ · JWT: https://jwt.io/introduction · bcrypt.js: https://github.com/dcodeIO/bcrypt.js
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/ · OWASP Top 10: https://owasp.org/www-project-top-ten/
- Render: https://render.com/docs · Vercel: https://vercel.com/docs
