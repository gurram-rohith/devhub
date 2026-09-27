import api from './axios';

export const createTask = (data) => api.post('/tasks', data);
export const listWorkspaceTasks = (workspaceId, params = {}) =>
  api.get(`/tasks/workspace/${workspaceId}`, { params });
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);