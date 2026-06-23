import api from './api';

// No auth required on any of these endpoints
export const getUsuarioSkills = (params) =>
  api.get('/usuario_skills', { params }).then((r) => r.data);

export const searchUsuarioSkills = (params) =>
  api.get('/usuario_skills/search', { params }).then((r) => r.data);

export const createUsuarioSkill = (data) =>
  api.post('/usuario_skills', data).then((r) => r.data);

export const updateUsuarioSkill = (id, data) =>
  api.put(`/usuario_skills/${id}`, data).then((r) => r.data);

export const deleteUsuarioSkill = (id) =>
  api.delete(`/usuario_skills/${id}`).then((r) => r.data);
