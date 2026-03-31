import api from './api';

const notificationService = {
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Client notification sender
  getClientUsers: async () => {
    const response = await api.get('/notifications/client/users');
    return response.data;
  },

  getClientGroups: async () => {
    const response = await api.get('/notifications/client/groups');
    return response.data;
  },

  createClientGroup: async (payload) => {
    const response = await api.post('/notifications/client/groups', payload);
    return response.data;
  },

  getClientCampaigns: async () => {
    const response = await api.get('/notifications/client/campaigns');
    return response.data;
  },

  createClientCampaign: async (payload) => {
    const response = await api.post('/notifications/client/campaigns', payload);
    return response.data;
  }
};

export default notificationService;
