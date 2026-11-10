import axios from 'axios';

// En producción VITE_API_URL apunta al backend desplegado; en desarrollo se usa el proxy de Vite.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 20000 });

const TOKEN_KEY = 'crm_token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Sesión vencida o inválida: se avisa a la app para cerrar sesión.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/login')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Mensaje legible + errores por campo (los envía el backend en "details").
export function parseError(error) {
  const data = error.response?.data;
  const fields = {};
  (data?.details || []).forEach((d) => { if (d.field && !fields[d.field]) fields[d.field] = d.message; });
  const message = data?.message || (error.request ? 'No se pudo conectar con el servidor. Verifica que el backend esté activo.' : 'Ocurrió un error inesperado');
  return { message, fields };
}

export default api;
