import api from './api';

const analyticsService = {
  getSankalpAnalytics: async () => {
    try {
      const response = await api.get('/analytics/sankalpas');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default analyticsService;
