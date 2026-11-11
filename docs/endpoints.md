# Endpoints de la API REST

Prefijo `/api`. Formato JSON. Autenticación: cabecera `Authorization: Bearer <token>` (excepto donde se indica "Público").

**Listados:** `?page=1&limit=10&sort=-createdAt&search=texto` + filtros propios. Respuesta: `{ data, page, limit, total, totalPages }` (máx. 100 por página).
**Errores:** `{ "message": "...", "details": [{ "field": "...", "message": "..." }] }` con códigos 400 (datos inválidos), 401 (sin sesión), 403 (sin permiso), 404, 409 (duplicado o integridad), 413, 500.
**Alcance por rol:** el *asesor* solo ve y modifica los registros que tiene asignados (clientes por `assignedTo`, oportunidades y actividades por `owner`, tareas por `assignedTo`). Las empresas son compartidas.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | /health | Público | Estado del servicio y de la conexión a MongoDB |
| GET | /auth/setup-status | Público | `{ needsSetup }`: true si no existe ningún usuario |
| POST | /auth/register | Público, solo si no hay usuarios | Crea el administrador inicial |
| POST | /auth/login | Público | Devuelve `{ token, user }` (limitado por tasa) |
| GET | /auth/me | Autenticado | Usuario de la sesión |
| GET | /users/options | Autenticado | Lista liviana (id, nombre, rol) para selectores de responsable |
| GET | /users | Admin | Listado (search, role, active) |
| POST | /users | Admin | Crear usuario |
| PUT | /users/:id | Admin | Editar nombre, rol, estado o contraseña |
| DELETE | /users/:id | Admin | **Desactiva** el usuario (no se borra) |
| GET | /clients | Autenticado | Listado (search: nombre/correo/identificación; clientType, status, company, assignedTo) |
| POST | /clients | Autenticado | Crear (identificación y correo únicos) |
| GET / PUT | /clients/:id | Autenticado | Detalle / editar |
| DELETE | /clients/:id | Admin | Eliminar (409 si tiene oportunidades; borra sus actividades y tareas) |
| GET | /clients/:id/activities | Autenticado | Historial de actividades del cliente |
| GET | /companies | Autenticado | Listado (search: nombre/NIT/correo; sector, city) |
| POST | /companies | Autenticado | Crear (NIT único) |
| GET / PUT | /companies/:id | Autenticado | Detalle / editar |
| DELETE | /companies/:id | Admin | Eliminar (409 si tiene clientes u oportunidades) |
| GET | /companies/:id/contacts | Autenticado | Clientes asociados a la empresa |
| GET | /opportunities | Autenticado | Listado (search, status, client, company, owner) |
| POST | /opportunities | Autenticado | Crear (hereda la empresa del cliente si no se envía) |
| GET / PUT / DELETE | /opportunities/:id | Autenticado | Detalle / editar / eliminar |
| PATCH | /opportunities/:id/status | Autenticado | Cambiar estado (tablero Kanban) |
| GET | /activities | Autenticado | Listado (search, type, client, owner, from, to) |
| POST | /activities | Autenticado | Registrar |
| GET / PUT / DELETE | /activities/:id | Autenticado | Detalle / editar / eliminar |
| GET | /tasks | Autenticado | Listado (search, status, priority, client, assignedTo, `overdue=true`) |
| POST | /tasks | Autenticado | Crear |
| GET / PUT / DELETE | /tasks/:id | Autenticado | Detalle / editar / eliminar |
| PATCH | /tasks/:id/status | Autenticado | Cambiar estado |
| GET | /dashboard/summary | Autenticado | Indicadores, series y actividad reciente (agregaciones sobre MongoDB) |

## Valores permitidos
- Roles: `admin`, `advisor`.
- Cliente: `clientType` = persona | empresa | prospecto; `status` = activo | inactivo | potencial; `idType` = CC | CE | NIT | PAS | TI | OTRO.
- Oportunidad: `status` = nueva | en_contacto | en_negociacion | ganada | perdida.
- Actividad: `type` = llamada | correo | reunion | visita | seguimiento | otra.
- Tarea: `status` = pendiente | en_progreso | completada; `priority` = baja | media | alta.
