import api from './api';

// GET /aplicar?id_usuario=X  →  obtener aplicaciones del usuario
export const getAplicaciones = (id_usuario) =>
  api.get('/aplicar', { params: { id_usuario } }).then((r) => r.data);

// POST /aplicar/apply  →  aplicar a proyecto (con validación de duplicados)
// body: { id_usuario, id_proyecto, propuesta }
export const aplicarProyecto = (id_usuario, id_proyecto, propuesta) =>
  api.post('/aplicar/apply', { id_usuario, id_proyecto, propuesta }).then((r) => r.data);
