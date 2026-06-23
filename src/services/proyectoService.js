import api from './api';

export const getProyectos = () => api.get('/proyectos').then((r) => r.data);
export const getProyectoById = (id) => api.get(`/proyectos/${id}`).then((r) => r.data);
export const searchProyectos = (params) => api.get('/proyectos/search', { params }).then((r) => r.data);
export const createProyecto = (data) => api.post('/proyectos', data).then((r) => r.data);
export const updateProyecto = (id, data) => api.put(`/proyectos/${id}`, data).then((r) => r.data);
export const deleteProyecto = (id) => api.delete(`/proyectos/${id}`).then((r) => r.data);
