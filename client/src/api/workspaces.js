import api from './axios';

export const getMyWorkspaces = () => api.get('/workspaces');
export const createWorkspace = (data) => api.post('/workspaces', data);
export const joinWorkspace = (data) => api.post('/workspaces/join', data);
export const getWorkspace = (id) => api.get(`/workspaces/${id}`);
export const getWorkspaceStats = (id) => api.get(`/workspaces/${id}/stats`);