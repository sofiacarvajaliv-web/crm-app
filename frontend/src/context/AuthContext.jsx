import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { tokenStore } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  // Restaura la sesión validando el token contra el backend.
  useEffect(() => {
    if (!tokenStore.get()) return;
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const authenticate = async (path, body) => {
    const { data } = await api.post(path, body);
    tokenStore.set(data.token);
    setUser(data.user);
  };

  const value = {
    user, loading, logout,
    isAdmin: user?.role === 'admin',
    login: (email, password) => authenticate('/auth/login', { email, password }),
    registerFirstAdmin: (body) => authenticate('/auth/register', body),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
