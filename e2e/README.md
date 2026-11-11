# Pruebas de interfaz (Playwright)

Verifican la aplicación en un navegador real. Son **opcionales** y no forman parte de `npm test`.

## Requisitos
- Python 3 con Playwright: `pip install playwright` y `playwright install chromium`.
- Backend y frontend en marcha **apuntando a una base DESECHABLE** (por ejemplo `crm_e2e`, nunca la de datos reales): backend en `http://localhost:4000` y frontend en `http://127.0.0.1:5173`.
- Los scripts crean y borran registros: no los ejecutes contra datos reales.

## Orden de ejecución
1. Con la base **vacía**: `python 01_acceso_y_clientes.py` (crea el administrador `sofia@test.com`).
2. Cargar datos demo en esa misma base: `SEED_PASSWORD=DemoClave123 npm run seed` (desde `backend/`; en PowerShell: `$env:SEED_PASSWORD="DemoClave123"; npm run seed`).
3. Luego, en orden: `02_empresas.py`, `03_oportunidades.py`, `04_actividades.py`, `05_tareas.py`, `06_usuarios.py`.

Cada script imprime `PASS`/`FAIL` por comprobación y un `RESUMEN`. Dependen de los datos de demostración (por ejemplo, 12 tareas y 4 vencidas) y de que no queden datos sobrantes de una corrida anterior fallida.
