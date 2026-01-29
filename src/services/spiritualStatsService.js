import api from './api';

const spiritualStatsService = {
  // Get user spiritual statistics
  getUserStats: async () => {
    try {
      const response = await api.get('/spiritual-stats/');
      return response.data;
    } catch (error) {
      console.error('Get user stats error:', error);
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