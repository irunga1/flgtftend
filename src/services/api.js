import axios from 'axios';
import { route } from 'preact-router';

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => { unauthorizedHandler = fn; };

// Decode the exp claim from a JWT without an external library (base64url → JSON)
function isTokenExpired(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(b64));
    return exp ? exp < Date.now() / 1000 : false;
  } catch {
    return false; // can't decode → assume fresh, let the component show the error
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem('token');
      // Force-logout only when the token is genuinely expired or absent.
      // A 401 on a fresh token = backend config issue (SECRET_KEY not set, CORS, etc.)
      // — in that case let the error propagate so components can show a helpful message.
      if (!token || isTokenExpired(token)) {
        if (unauthorizedHandler) {
          unauthorizedHandler();
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          route('/login', true);
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
