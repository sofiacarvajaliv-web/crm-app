# Seguridad

Referencias: OWASP Cheat Sheet Series (https://cheatsheetseries.owasp.org/), OWASP Top 10 (https://owasp.org/www-project-top-ten/), guía de seguridad de Express (https://expressjs.com/en/advanced/best-practice-security.html).

## Medidas implementadas
| Medida | Dónde |
|---|---|
| Contraseñas cifradas con bcrypt (10 rondas); nunca en texto plano; el campo se excluye de las consultas (`select: false`) y de las respuestas | `models/User.js` |
| Política de contraseña: 8–72 caracteres, con letras y números | `validators/schemas.js`, frontend |
| Autenticación JWT con expiración (8 h por defecto) | `utils/token.js`, `middleware/auth.js` |
| El usuario se vuelve a leer de la base en cada petición: desactivar o cambiar el rol aplica de inmediato | `middleware/auth.js` |
| Control de acceso por rol en rutas y alcance por registro (el asesor no puede leer ni modificar registros ajenos) | `routes/index.js`, `services/crudFactory.js` |
| Registro público solo para el primer administrador; después solo un administrador crea usuarios | `controllers/authController.js` |
| Mensaje genérico de login ("Credenciales inválidas") y comparación con hash ficticio cuando el correo no existe | `controllers/authController.js` |
| Límite de intentos en login/registro y límite general de la API | `routes/index.js`, `app.js` |
| Validación de entrada con Zod (backend) y validaciones en formularios (frontend); campos desconocidos descartados | `middleware/validate.js` |
| Protección contra inyección NoSQL: `express-mongo-sanitize`, filtros de consulta forzados a texto y esquemas tipados | `app.js`, `utils/query.js` |
| Cabeceras de seguridad con `helmet` | `app.js` |
| CORS restringido a los orígenes de `CLIENT_URL`; un origen no permitido recibe 403 | `app.js` |
| Cuerpo de la petición limitado a 100 kB | `app.js` |
| Manejo centralizado de errores: en 500 no se filtran detalles internos | `middleware/errorHandler.js` |
| Secretos solo en variables de entorno; `.env` ignorado por Git; `.env.example` sin credenciales | `.gitignore`, `.env.example` |
| El seed de demostración se niega a ejecutarse con `NODE_ENV=production` | `seed/seed.js` |
| Las pruebas automáticas exigen una base cuyo nombre contenga "test" y nunca usan `MONGODB_URI` | `tests/env.setup.js` |
| `npm audit` sin vulnerabilidades en dependencias de producción (backend y frontend) | ver `pruebas.md` |

## Riesgos y limitaciones conocidas
- El JWT se guarda en `localStorage` del navegador: es sencillo, pero queda expuesto si existiera una vulnerabilidad XSS. React escapa el contenido por defecto y la aplicación no inserta HTML sin escapar. Una alternativa más robusta son cookies `HttpOnly`.
- No hay renovación (refresh) ni revocación de tokens individuales; el token vence a las 8 h. Desactivar al usuario sí invalida su sesión.
- No hay verificación en dos pasos ni recuperación de contraseña por correo. Un administrador puede restablecer el acceso con `npm run admin:reset`.
- La regla de red de Atlas `0.0.0.0/0` es práctica para Render (IPs variables) pero abre el acceso por red; la protección recae en el usuario y la contraseña de la base. Usa un usuario con permisos mínimos y una contraseña larga.
- Los límites de tasa son por instancia del servidor (memoria).
- No se registra una auditoría de cambios (quién modificó qué).
