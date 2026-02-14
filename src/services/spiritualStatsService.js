import api from './api';

const spiritualStatsService = {
  // Get user spiritual statistics
  getUserStats: async () => {
    try {
      const response = await api.get('/spiritual-stats/?limit=500');
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  },

  // Get user stats with category filter
  getUserStatsByCategory: async (category = 'all') => {
    try {
      const response = await api.get(`/spiritual-stats/?category=${category}`);
      return response.data;
    } catch (error) {
      console.error('Get user stats by category error:', error);
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

  // Get all users stats (for client side)
  getAllUsersStats: async (category = 'all') => {
    try {
      const response = await api.get(`/spiritual-stats/all-users?category=${category}`);
      return response.data;
    } catch (error) {
      console.error('Get all users stats error:', error);
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