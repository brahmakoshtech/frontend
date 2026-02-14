import api from './api';

const userSankalpService = {
  // Join a sankalp
  join: async (sankalpId, customDays = null, reminderTime = null) => {
    try {
      const payload = { sankalpId };
      if (customDays) payload.customDays = customDays;
      if (reminderTime) payload.reminderTime = reminderTime;
      
      const response = await api.post('/user-sankalp/join', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user's sankalpas
  getMySankalpas: async (status = null) => {
    try {
      const url = status ? `/user-sankalp/my-sankalpas?status=${status}` : '/user-sankalp/my-sankalpas';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single user sankalp
  getById: async (id) => {
    try {
      const response = await api.get(`/user-sankalp/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Submit daily report
  submitReport: async (id, status) => {
    try {
      const response = await api.post(`/user-sankalp/${id}/report`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get progress
  getProgress: async (id) => {
    try {
      const response = await api.get(`/user-sankalp/${id}/progress`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Abandon sankalp
  abandon: async (id) => {
    try {
      const response = await api.delete(`/user-sankalp/${id}/abandon`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check if joined
  checkJoined: async (sankalpId) => {
    try {
      const response = await api.get(`/user-sankalp/check-joined/${sankalpId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userSankalpService;
