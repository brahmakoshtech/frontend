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

const testimonialService = {
  // Get all testimonials
  async getAllTestimonials() {
    try {
      const response = await axios.get(`${API_BASE_URL}/testimonials`, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Create new testimonial
  async createTestimonial(testimonialData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/testimonials`, testimonialData, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating testimonial:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Update testimonial
  async updateTestimonial(id, testimonialData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/testimonials/${id}`, testimonialData, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating testimonial:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete testimonial
  async deleteTestimonial(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/testimonials/${id}`, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload image for testimonial
  async uploadImage(testimonialId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await axios.post(`${API_BASE_URL}/testimonials/${testimonialId}/image`, formData, {
        headers: getAuthHeaders()
        // Don't set Content-Type for FormData - browser sets it automatically with boundary
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.response?.data?.message || error.message };
    }
  }
};

export default testimonialService;