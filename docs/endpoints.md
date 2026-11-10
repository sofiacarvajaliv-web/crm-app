# Endpoints de la API REST (prefijo `/api`)

Listados: `?page=1&limit=10&sort=-createdAt&search=…` + filtros propios. Respuesta: `{ data, page, limit, total, totalPages }`.

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | /auth/register | Público solo si no existen usuarios | Crea el admin inicial |
| POST | /auth/login | Público | Devuelve JWT |
| GET | /auth/me | Autenticado | Usuario actual |
| GET/POST | /users | Admin | Listar / crear usuarios |
| PUT/DELETE | /users/:id | Admin | Editar / desactivar |
| GET/POST | /clients | Auth | Listar (search, type, status) / crear |
| GET/PUT | /clients/:id | Auth | Detalle / editar |
| DELETE | /clients/:id | Admin | Eliminar |
| GET | /clients/:id/activities | Auth | Historial |
| GET/POST | /companies | Auth | Listar / crear |
| GET/PUT | /companies/:id | Auth | Detalle / editar |
| DELETE | /companies/:id | Admin | Eliminar |
| GET | /companies/:id/contacts | Auth | Clientes asociados |
| GET/POST | /opportunities | Auth | Listar (status, owner) / crear |
| GET/PUT/DELETE | /opportunities/:id | Auth | Detalle / editar / eliminar |
| PATCH | /opportunities/:id/status | Auth | Cambiar estado (Kanban) |
| GET/POST | /activities | Auth | Listar / crear |
| PUT/DELETE | /activities/:id | Auth | Editar / eliminar |
| GET/POST | /tasks | Auth | Listar (status, priority, assignedTo, overdue=true) / crear |
| PUT/PATCH/DELETE | /tasks/:id | Auth | Editar / cambiar estado / eliminar |
| GET | /dashboard/summary | Auth | Indicadores y series (agregaciones) |
| GET | /health | Público | Estado del servicio y de la conexión a Mongo |
