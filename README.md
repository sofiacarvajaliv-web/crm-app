# NexoCRM

Aplicación web CRM (Customer Relationship Management) con arquitectura cliente-servidor: **React + Vite + Tailwind CSS** en el frontend, **Node.js + Express + Mongoose** en el backend y base de datos documental en **MongoDB Atlas**. Proyecto académico.

## Funcionalidades
- Acceso con JWT, roles (administrador / asesor comercial) y rutas protegidas.
- **Panel** con indicadores y gráficos calculados desde la base de datos.
- **Clientes**, **Empresas**, **Oportunidades** (tablero Kanban), **Actividades**, **Tareas** y **Usuarios** con CRUD completo, búsqueda, filtros, orden y paginación.
- Validación en frontend y backend, confirmación antes de eliminar, manejo de errores y diseño responsive.

## Tecnologías
| Capa | Tecnologías |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Axios, Recharts |
| Backend | Node.js 18+, Express 4, Mongoose 8, JWT, bcryptjs, Zod, helmet, express-rate-limit |
| Datos | MongoDB Atlas (`crm_database`: users, clients, companies, opportunities, activities, tasks) |
| Pruebas | Jest + Supertest (backend), Playwright (interfaz) |
| Despliegue | Render (API), Vercel (web), GitHub |

## Estructura
```
crm-app/
├── backend/     API REST (src/config, models, validators, middleware, controllers, services, routes, utils, seed, tests)
├── frontend/    Aplicación React (src/pages, components, layouts, context, hooks, services)
├── docs/        Documentación técnica y académica
├── e2e/         Pruebas de interfaz (opcionales)
├── render.yaml  Blueprint de despliegue del backend
└── README.md
```

## Inicio rápido
Requisitos: Node.js 18+ y un clúster de MongoDB Atlas (guía completa en [docs/despliegue.md](docs/despliegue.md)).
```bash
# Backend
cd backend
npm install
cp .env.example .env     # Windows: copy .env.example .env  → completa MONGODB_URI y JWT_SECRET
npm run db:check         # prueba la conexión a MongoDB
npm run dev              # http://localhost:4000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```
Con la base vacía, la pantalla de ingreso permite **crear el administrador inicial**.

## Scripts del backend
| Comando | Qué hace |
|---|---|
| `npm run dev` / `npm start` | Inicia la API (con recarga / modo producción) |
| `npm run db:check` | Prueba la conexión a MongoDB sin mostrar credenciales |
| `npm run seed` · `npm run seed -- --reset` | Carga / recrea **solo** datos de demostración (`@demo.test`) |
| `npm run admin:reset -- correo NuevaClave123` | Restablece la contraseña de un usuario y lo reactiva |
| `npm test` | Ejecuta las pruebas (requiere `MONGODB_URI_TEST` con una base cuyo nombre contenga "test") |

## Variables de entorno
Ver `backend/.env.example` y `frontend/.env.example`. **Nunca subas archivos `.env` a GitHub.**

## Documentación
[Análisis y requerimientos](docs/analisis.md) · [Modelo de datos](docs/modelo-datos.md) · [Arquitectura](docs/arquitectura.md) · [Endpoints](docs/endpoints.md) · [Seguridad](docs/seguridad.md) · [Pruebas](docs/pruebas.md) · [Instalación y despliegue](docs/despliegue.md) · [Informe final](docs/informe-final.md)

## Integrantes
Alejando Hincapie- Sofia Carvajal 
