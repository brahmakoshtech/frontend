import api from './api';

const meditationService = {
  // Get all meditations
  getAll: async () => {
    try {
      const response = await api.get('/meditations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single meditation
  getById: async (id) => {
    try {
      const response = await api.get(`/meditations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create meditation
  create: async (formData) => {
    try {
      const response = await api.post('/meditations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update meditation
  update: async (id, formData) => {
    try {
      const response = await api.put(`/meditations/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete meditation
  delete: async (id) => {
    try {
      const response = await api.delete(`/meditations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default meditationService;