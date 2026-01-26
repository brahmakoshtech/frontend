import api from './api.js';

const expertService = {
  // Get all experts
  getExperts: async (includeInactive = false, categoryId = null) => {
    try {
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      if (categoryId) params.append('categoryId', categoryId);
      
      const response = await api.get(`/experts?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get expert by ID
  getExpertById: async (id) => {
    try {
      const response = await api.get(`/experts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create expert
  createExpert: async (expertData) => {
    try {
      const response = await api.post('/experts', expertData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update expert
  updateExpert: async (id, expertData) => {
    try {
      const response = await api.put(`/experts/${id}`, expertData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete expert
  deleteExpert: async (id) => {
    try {
      const response = await api.delete(`/experts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Toggle expert status
  toggleExpert: async (id) => {
    try {
      const response = await api.patch(`/experts/${id}/toggle`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload profile photo
  uploadProfilePhoto: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const response = await api.post(`/experts/${id}/upload-profile-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Upload background banner
  uploadBackgroundBanner: async (id, file) => {
    try {
      const formData = new FormData();
      formData.append('backgroundBanner', file);
      
      const response = await api.post(`/experts/${id}/upload-banner`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default expertService;