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

// NEW: GET /freelancer_proyectos/myprojectscl?idclient=<id>
// Devuelve los proyectos publicados por el cliente y la info de quien aplicó.
// (según tu descripción, NO está protegido por authJwt)
export const getMyProjectsClient = (idclient) =>
  api.get('/freelancer_proyectos/myprojectscl', { params: { idclient } }).then((r) => r.data);

// NEW: GET /freelancer_proyectos/myprojectsfl?idfreelancer=<id>
// Devuelve las aplicaciones/proyectos del freelancer.
export const getMyProjectsFreelancer = (idfreelancer) =>
  api
    .get('/freelancer_proyectos/myprojectsfl', { params: { idfreelancer } })
    .then((r) => r.data);


// POST / PUT / DELETE also have no auth requirement
export const createFreelancerProyecto = (data) =>
  api.post('/freelancer_proyectos', data).then((r) => r.data);

export const updateFreelancerProyecto = (id, data) =>
  api.put(`/freelancer_proyectos/${id}`, data).then((r) => r.data);

// GET /freelancer_proyectos/selected/{id}?change=true
export const selectedFreelancerProyecto = (id, change = true) =>
  api
    .get(`/freelancer_proyectos/selected/${id}`, { params: { change } })
    .then((r) => r.data);

export const deleteFreelancerProyecto = (id) =>
  api.delete(`/freelancer_proyectos/${id}`).then((r) => r.data);


