import api from './axios';

export const createEvent = (data) => api.post('/events', data);
export const listWorkspaceEvents = (workspaceId) => api.get(`/events/workspace/${workspaceId}`);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
export const rsvpEvent = (id) => api.post(`/events/${id}/rsvp`);
export const cancelRsvp = (id) => api.delete(`/events/${id}/rsvp`);