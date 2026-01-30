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

  // Get spiritual check-in data (activities + user stats)
  getSpiritualCheckinData: async () => {
    try {
      const token = localStorage.getItem('token_user') || localStorage.getItem('token_client');
      const response = await axios.get(`${API_BASE_URL}/mobile/content/spiritual-checkin`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get spiritual checkin data error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch data',
        error: error.message
      };
    }
  },

  // Get single spiritual check-in configuration
  getSpiritualCheckinConfiguration: async (id) => {
    try {
      const token = localStorage.getItem('token_user') || localStorage.getItem('token_client');
      const response = await axios.get(`${API_BASE_URL}/spiritual-configurations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get spiritual checkin configuration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch configuration',
        error: error.message
      };
    }
  },

  // Get all spiritual check-in configurations
  getAllSpiritualCheckinConfigurations: async (type = null) => {
    try {
      const token = localStorage.getItem('token_user') || localStorage.getItem('token_client');
      let url = `${API_BASE_URL}/spiritual-configurations`;
      
      if (type) {
        url += `?type=${type}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get all spiritual checkin configurations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch configurations',
        error: error.message
      };
    }
  },

  // Get Single Check-in all configration
  getSingleCheckinAllConfigration: async (categoryId) => {
    try {
      const token = localStorage.getItem('token_user') || localStorage.getItem('token_client');
      let url = `${API_BASE_URL}/spiritual-configurations`;
      
      if (categoryId) {
        url += `?categoryId=${categoryId}`;
      }
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get Single Check-in all configration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch configurations',
        error: error.message
      };
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