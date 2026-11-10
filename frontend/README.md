# Frontend – NexoCRM

React 19 + Vite + Tailwind CSS 4 + React Router + Axios + Recharts.

## Ejecutar en local
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173  (el backend debe estar en http://localhost:4000)
```
En desarrollo, Vite redirige `/api` al backend (ver `vite.config.js`), así que no hay que configurar nada más.

## Producción (Vercel)
Define la variable `VITE_API_URL` con la URL pública del backend terminada en `/api` (ver `.env.example`) y ejecuta `npm run build`.

## Módulos construidos hasta ahora
Inicio de sesión / creación del administrador inicial, Panel (indicadores reales), Clientes (CRUD, búsqueda, filtros, orden, paginación, historial), Empresas (CRUD y contactos asociados), Oportunidades (tablero Kanban con arrastrar y soltar), Actividades (registro, filtros e historial por cliente), Tareas (prioridad, estados, vencidas y filtros).
Pendiente: Usuarios (solo administrador).

## Estructura
`src/pages` · `src/components` · `src/layouts` · `src/context` · `src/hooks` · `src/services`
