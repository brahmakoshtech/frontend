import api from './api.js';

const spiritualConfigurationService = {
  // Get all spiritual configurations
  getAllConfigurations: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append('type', params.type);
      
      const url = queryParams.toString() ? `/spiritual-configurations?${queryParams}` : '/spiritual-configurations';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create spiritual configuration
  createConfiguration: async (configData) => {
    try {
      const response = await api.post('/spiritual-configurations', configData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update spiritual configuration
  updateConfiguration: async (id, configData) => {
    try {
      const response = await api.put(`/spiritual-configurations/${id}`, configData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete spiritual configuration
  deleteConfiguration: async (id) => {
    try {
      const response = await api.delete(`/spiritual-configurations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle configuration status
  toggleConfiguration: async (id) => {
    try {
      const response = await api.patch(`/spiritual-configurations/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default spiritualConfigurationService;