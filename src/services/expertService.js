import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const expertService = {
  // Get all experts
  getExperts: async (categoryId = null, includeInactive = false) => {
    try {
      const token = localStorage.getItem('token_client');
      let url = `${API_BASE_URL}/experts`;
      
      const params = [];
      // Add category filter if provided
      if (categoryId) {
        params.push(`categoryId=${categoryId}`);
      }
      // Add includeInactive parameter
      if (includeInactive) {
        params.push('includeInactive=true');
      }
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get experts error:', error);
      throw error;
    }
  },

  // Get single expert
  getExpert: async (id) => {
    try {
      const token = localStorage.getItem('token_client');
      const response = await axios.get(`${API_BASE_URL}/experts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get expert error:', error);
      throw error;
    }
  },

  // Create expert
  createExpert: async (expertData) => {
    try {
      const token = localStorage.getItem('token_client');
      const response = await axios.post(`${API_BASE_URL}/experts`, expertData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create expert error:', error);
      throw error;
    }
  },

  // Update expert
  updateExpert: async (id, expertData) => {
    try {
      const token = localStorage.getItem('token_client');
      const response = await axios.put(`${API_BASE_URL}/experts/${id}`, expertData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Update expert error:', error);
      throw error;
    }
  },

  // Delete expert
  deleteExpert: async (id) => {
    try {
      const token = localStorage.getItem('token_client');
      const response = await axios.delete(`${API_BASE_URL}/experts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Delete expert error:', error);
      throw error;
    }
  },

  // Upload profile photo
  uploadProfilePhoto: async (expertId, file) => {
    try {
      const token = localStorage.getItem('token_client');
      const formData = new FormData();
      formData.append('profilePhoto', file);
      
      const response = await axios.post(`${API_BASE_URL}/experts/${expertId}/upload-profile-photo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upload profile photo error:', error);
      throw error;
    }
  },

  // Upload background banner
  uploadBanner: async (expertId, file) => {
    try {
      const token = localStorage.getItem('token_client');
      const formData = new FormData();
      formData.append('backgroundBanner', file);
      
      const response = await axios.post(`${API_BASE_URL}/experts/${expertId}/upload-banner`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upload banner error:', error);
      throw error;
    }
  },

  // Toggle expert status
  toggleExpert: async (id) => {
    try {
      const token = localStorage.getItem('token_client');
      const response = await axios.patch(`${API_BASE_URL}/experts/${id}/toggle`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Toggle expert error:', error);
      throw error;
    }
  }
};

export default expertService;