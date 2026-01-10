import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get client token
const getClientToken = () => {
  const token = localStorage.getItem('token_client');
  return token;
};

// Helper function to get auth headers for client
const getAuthHeaders = () => {
  const token = getClientToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const founderMessageService = {
  // Get all founder messages
  async getAllMessages() {
    try {
      console.log('Frontend: Getting all messages from:', `${API_BASE_URL}/founder-messages`);
      
      const response = await axios.get(`${API_BASE_URL}/founder-messages`, {
        headers: getAuthHeaders()
      });
      
      console.log('Frontend: Messages received:', response.data);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Frontend: Error getting messages:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get single founder message
  async getMessage(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/founder-messages/${id}`, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Create new founder message (without image)
  async createMessage(messageData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/founder-messages`, messageData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        }
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Upload image for founder message
  async uploadImage(messageId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('founderImage', imageFile);
      
      const response = await axios.post(`${API_BASE_URL}/founder-messages/${messageId}/upload-image`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Update founder message
  async updateMessage(id, messageData) {
    try {
      const formData = new FormData();
      formData.append('founderName', messageData.founderName);
      formData.append('position', messageData.position);
      formData.append('content', messageData.content);
      formData.append('status', messageData.status);
      
      if (messageData.founderImage) {
        formData.append('founderImage', messageData.founderImage);
      }
      
      const response = await axios.put(`${API_BASE_URL}/founder-messages/${id}`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Delete founder message
  async deleteMessage(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/founder-messages/${id}`, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Toggle message status (publish/unpublish)
  async toggleStatus(id) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/founder-messages/${id}/toggle`, {}, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Increment views
  async incrementViews(id) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/founder-messages/${id}/view`, {}, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get presigned URL for S3 image
  async getPresignedImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    // Skip presigned URL for localhost/local URLs (these are old messages)
    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1') || imageUrl.startsWith('/uploads/')) {
      return imageUrl; // Return as-is for local URLs
    }
    
    // Check if it's an S3 URL
    const isS3Url = imageUrl.includes('s3.amazonaws.com') || imageUrl.includes('amazonaws.com');
    if (!isS3Url) {
      return imageUrl; // Return as-is for non-S3 URLs
    }
    
    try {
      // Extract key from S3 URL
      // Format: https://bucket.s3.region.amazonaws.com/key
      const url = new URL(imageUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      
      // Get presigned URL from backend with authentication
      const response = await axios.get(`${API_BASE_URL}/upload/presigned-url/${encodeURIComponent(key)}`, {
        headers: getAuthHeaders()
      });
      if (response.data.success && response.data.data.presignedUrl) {
        return response.data.data.presignedUrl;
      }
    } catch (error) {
      // If auth fails, return original URL (might work if bucket is public)
    }
    
    // Fallback to original URL
    return imageUrl;
  }
};

export default founderMessageService;