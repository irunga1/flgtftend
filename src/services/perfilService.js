import api from './api';

// GET /perfil?id_usuario=X  →  { id_usuario, user: {...}, skills: [{id_skill, nombre, nivel}] }
export const getPerfil = (id_usuario) =>
  api.get('/perfil', { params: { id_usuario } }).then((r) => r.data);

// PUT /perfil  →  update nombre/email/password + add/remove skills
// body: { id_usuario, nombre?, email?, password?, skillsToAdd: [{id_skill}], skillsToDelete: [id_usuario_skill] }
export const updatePerfil = (data) =>
  api.put('/perfil', data).then((r) => r.data);

