import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://prod.brahmakosh.com/api';

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
      // Handle 404 errors gracefully (endpoint not implemented)
      if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Image upload endpoint not available',
          error: 'ENDPOINT_NOT_FOUND'
        };
      }
      // For other errors, return structured response instead of throwing
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to upload image',
        error: error.message
      };
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
      // Fallback to activities only if mobile endpoint fails
      try {
        const activitiesResponse = await spiritualActivityService.getSpiritualActivities(false);
        return {
          success: true,
          data: {
            activities: activitiesResponse.data || activitiesResponse || [],
            stats: {
              sessions: 0,
              minutes: 0,
              points: 0,
              days: 0
            },
            motivation: {
              emoji: '🌸 ✨ 🕊️',
              title: 'Small steps, big transformation',
              text: 'Your spiritual check-in earns karma points that feed cows, educate children, and help those in need.'
            }
          }
        };
      } catch (fallbackError) {
        return {
          success: false,
          message: 'Failed to fetch data',
          error: fallbackError.message
        };
      }
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