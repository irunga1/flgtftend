import api from './api';
import { encript } from '../utils/cripter';

export const login = (email, password) =>
  api.post('/login', { email, password }).then((r) => r.data);

// POST /forgot
export const forgotPassword = (email) =>
  api.post('/login/forgot', { email }).then((r) => r.data);





