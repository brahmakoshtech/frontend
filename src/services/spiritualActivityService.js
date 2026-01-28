import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const spiritualActivityService = {
  // Get all spiritual activities
  getSpiritualActivities: async (includeInactive = false) => {
    try {
      const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
      let url = `${API_BASE_URL}/spiritual-activities`;
      
      if (includeInactive) {
        url += '?includeInactive=true';
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get spiritual activities error:', error);
      throw error;
    }
  },

  // Get single spiritual activity
  getSpiritualActivity: async (id) => {
    try {
      const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
      const response = await axios.get(`${API_BASE_URL}/spiritual-activities/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get spiritual activity error:', error);
      throw error;
    }
  },

  // Create spiritual activity
  createSpiritualActivity: async (activityData) => {
    try {
      const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
      const response = await axios.post(`${API_BASE_URL}/spiritual-activities`, activityData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create spiritual activity error:', error);
      throw error;
    }
  },

  // Update spiritual activity
  updateSpiritualActivity: async (id, activityData) => {
    try {
      const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
      const response = await axios.put(`${API_BASE_URL}/spiritual-activities/${id}`, activityData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Update spiritual activity error:', error);
      throw error;
    }
  },

  // Delete spiritual activity
  deleteSpiritualActivity: async (id) => {
    try {
      const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
      const response = await axios.delete(`${API_BASE_URL}/spiritual-activities/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Delete spiritual activity error:', error);
      throw error;
    }
  },

  // Upload image for spiritual activity
  uploadActivityImage: async (activityId, file) => {
    try {
      const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(`${API_BASE_URL}/spiritual-activities/${activityId}/upload-image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Upload activity image error:', error);
      throw error;
    }
  },

  // Toggle spiritual activity status
  toggleSpiritualActivity: async (id) => {
    try {
      const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
      const response = await axios.patch(`${API_BASE_URL}/spiritual-activities/${id}/toggle`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Toggle spiritual activity error:', error);
      throw error;
    }
  }
};

export default spiritualActivityService;