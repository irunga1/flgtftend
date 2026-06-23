import { createContext } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';
import { route } from 'preact-router';
import { useToast } from './ToastContext';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { showToast } = useToast();

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setAuth = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = (expired = false) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (expired) showToast('Tu sesión expiró. Inicia sesión nuevamente.', 'warning');
    route('/login', true);
  };

  const isAuthenticated = () => !!localStorage.getItem('token');

  // Let the API interceptor trigger logout (with toast) instead of a hard page reload
  useEffect(() => {
    setUnauthorizedHandler(() => logout(true));
    return () => setUnauthorizedHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setAuth, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
