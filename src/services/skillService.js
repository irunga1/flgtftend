import api from './api';

export const getSkills = () => api.get('/skills').then((r) => r.data);
export const getSkillById = (id) => api.get(`/skills/${id}`).then((r) => r.data);
export const searchSkills = (params) => api.get('/skills/search', { params }).then((r) => r.data);
export const createSkill = (data) => api.post('/skills', data).then((r) => r.data);
export const updateSkill = (id, data) => api.put(`/skills/${id}`, data).then((r) => r.data);
export const deleteSkill = (id) => api.delete(`/skills/${id}`).then((r) => r.data);
