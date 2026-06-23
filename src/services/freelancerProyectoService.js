import api from './api';

// Requires auth
export const getFreelancerProyectos = (params) =>
  api.get('/freelancer_proyectos', { params }).then((r) => r.data);

export const getByProyecto = (id_proyecto) =>
  api.get('/freelancer_proyectos', { params: { id_proyecto } }).then((r) => r.data);

// /search has NO auth requirement — use this for public-facing lookups
export const searchFreelancerProyectos = (params) =>
  api.get('/freelancer_proyectos/search', { params }).then((r) => r.data);

export const searchByProyecto = (id_proyecto) =>
  api.get('/freelancer_proyectos/search', { params: { id_proyecto } }).then((r) => r.data);

// POST / PUT / DELETE also have no auth requirement
export const createFreelancerProyecto = (data) =>
  api.post('/freelancer_proyectos', data).then((r) => r.data);

export const updateFreelancerProyecto = (id, data) =>
  api.put(`/freelancer_proyectos/${id}`, data).then((r) => r.data);

export const deleteFreelancerProyecto = (id) =>
  api.delete(`/freelancer_proyectos/${id}`).then((r) => r.data);
