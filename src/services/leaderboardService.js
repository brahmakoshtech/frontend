import api from './api';

const leaderboardService = {
  getSankalpLeaderboard: async (limit = 10) => {
    try {
      const response = await api.get(`/leaderboard/sankalpas?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getKarmaLeaderboard: async (limit = 10) => {
    try {
      const response = await api.get(`/leaderboard/karma?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default leaderboardService;
