import api from './api';

const spiritualStatsService = {
  // Get user spiritual statistics
  getUserStats: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `/spiritual-stats/?${queryParams}` : '/spiritual-stats/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  },

  // Get all users spiritual statistics (for client side)
  getAllUsersStats: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = queryParams ? `/spiritual-stats/all-users?${queryParams}` : '/spiritual-stats/all-users';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get all users stats error:', error);
      throw error;
    }
  },

  // Save spiritual session
  saveSession: async (sessionData) => {
    try {
      const response = await api.post('/spiritual-stats/save-session', sessionData);
      return response.data;
    } catch (error) {
      console.error('Save session error:', error);
      throw error;
    }
  },

  // Toggle session status
  toggleSession: async (sessionId) => {
    try {
      const response = await api.patch(`/spiritual-stats/${sessionId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Toggle session error:', error);
      throw error;
    }
  },

  // Delete session
  deleteSession: async (sessionId) => {
    try {
      const response = await api.delete(`/spiritual-stats/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Delete session error:', error);
      throw error;
    }
  }
};

export default spiritualStatsService;