# Pruebas realizadas

Resultados de la última ejecución completa (10 de noviembre de 2026). Todo se ejecutó sobre una base MongoDB 8.3.7 **local y desechable**, en el entorno de desarrollo. **No se ejecutaron contra MongoDB Atlas ni contra Render o Vercel.**

## 1. Pruebas automáticas del backend (Jest + Supertest)
`npm test` en `backend/` · 1 suite · **60 pruebas, 60 superadas.**

| Área | Qué se verifica |
|---|---|
| Conexión | `/api/health` informa la base como conectada |
| Autenticación | registro del primer administrador, bloqueo del registro público posterior, login correcto/incorrecto, contraseña guardada con bcrypt (`$2…`), rechazo de inyección NoSQL en el login |
| Protección de rutas | 401 sin token y con token falso; `/auth/me` con token válido |
| Usuarios y roles | el admin crea asesores; el asesor recibe 403 al gestionar usuarios; correo duplicado → 409; usuario desactivado pierde la sesión; el admin no puede desactivarse |
| Empresas | crear, NIT duplicado, validaciones, consultar, buscar, editar, ids inválidos (400) e inexistentes (404), borrado solo admin |
| Clientes | crear con normalización de correo, duplicados de identificación y correo (409), validaciones, búsqueda por nombre/correo/identificación, filtros, paginación y orden, parámetros maliciosos no interpretados, alcance por rol, edición, contactos de empresa |
| Oportunidades | crear con herencia de empresa, validaciones, cambio de estado, filtro por estado, alcance por rol, bloqueo de borrado de cliente/empresa con vínculos |
| Actividades | registrar, validaciones (tipo, seguimiento anterior a la fecha), historial por cliente, filtros, edición |
| Tareas | crear, vencidas (excluye completadas), filtros, cambio de estado, alcance por rol |
| Dashboard | totales, rendimiento, oportunidades por estado, clientes por mes y actividad reciente calculados desde datos reales; vista de asesor; los indicadores cambian al cambiar los datos |
| Integridad | borrado en cascada de actividades y tareas del cliente; empresa sin vínculos se elimina |
| Errores | ruta inexistente (404), JSON malformado (400), origen CORS no permitido (403) y permitido (200) |

## 2. Pruebas de interfaz en navegador (Playwright + Chromium)
Carpeta `e2e/`. Se ejecutaron en orden sobre una base nueva: la primera con la base vacía y las demás con los datos de demostración.

| Script | Comprobaciones superadas |
|---|---|
| 01_acceso_y_clientes | 19 / 19 |
| 02_empresas | 10 / 10 |
| 03_oportunidades | 11 / 11 |
| 04_actividades | 11 / 11 (con zona horaria America/Bogota) |
| 05_tareas | 12 / 12 (con zona horaria America/Bogota) |
| 06_usuarios | 13 / 13 |
| **Total** | **76 / 76** |

Cubren: creación del administrador inicial, login/logout, protección de rutas, CRUD con confirmación de borrado, búsqueda, filtros, paginación, tablero Kanban (cambio de estado y arrastrar/soltar con persistencia tras recargar), historial por cliente, tareas vencidas y enlace de la campana, control de acceso por rol (menú y rutas), desactivación y reactivación de usuarios, ausencia de errores de JavaScript.

Notas de honestidad sobre estas pruebas:
- Durante el desarrollo, varios scripts fallaron en intentos intermedios por errores **del propio script** (esperas, datos sobrantes de una corrida anterior, sesión compartida); se corrigieron y se repitió la ejecución completa. También se encontraron y corrigieron **defectos reales de la aplicación** (origen CORS no permitido devolvía 500; el enlace de la campana no aplicaba el filtro estando ya en Tareas; fechas de cierre que retrocedían un día en hora de Colombia).
- Los únicos mensajes de consola del navegador fueron la carga de Google Fonts (sin internet en el entorno de pruebas) y el 409 provocado a propósito para probar duplicados.
- Revisión visual: se inspeccionaron capturas de escritorio del panel, clientes y Kanban, y se comprobó que no hay desplazamiento horizontal en móvil (390 px). La vista móvil no se revisó con capturas.

## 3. Dependencias (`npm audit`)
| Proyecto | Producción | Con desarrollo |
|---|---|---|
| backend | 0 vulnerabilidades | avisos de severidad moderada en `deepmerge` y `glob`, que llegan por Jest (solo desarrollo; no se despliegan) |
| frontend | 0 vulnerabilidades | 0 vulnerabilidades |

## 4. Lo que NO se ha verificado
- Conexión desde el entorno de desarrollo a **MongoDB Atlas** (la prueba de Atlas la realiza el equipo con `npm run db:check`).
- Despliegue en **Render** y **Vercel** (ver `despliegue.md`; la lista de comprobación del final sirve para verificarlo).
- Rendimiento con grandes volúmenes de datos ni pruebas de carga.
- Navegadores distintos de Chromium, ni dispositivos móviles reales.

## 5. Cómo repetirlas
- Backend: `MONGODB_URI_TEST="mongodb://127.0.0.1:27017/crm_test" npm test` (requiere un MongoDB local, o una base de Atlas cuyo nombre contenga "test").
- Interfaz: ver `e2e/README.md`.
