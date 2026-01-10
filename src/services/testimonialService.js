import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Helper function to get presigned URL for S3 images
const getPresignedImageUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  
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
    
    // Get presigned URL from backend
    const response = await axios.get(`${API_BASE_URL}/upload/presigned-url/${encodeURIComponent(key)}`);
    if (response.data.success && response.data.data.presignedUrl) {
      return response.data.data.presignedUrl;
    }
  } catch (error) {
    // console.warn('Failed to get presigned URL, using original:', error);
  }
  
  // Fallback to original URL
  return imageUrl;
};

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
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Create new testimonial
  async createTestimonial(testimonialData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/testimonials`, testimonialData, {
        headers: getAuthHeaders()
      });
      // Backend returns {success: true, data: testimonial}
      // Extract the data object directly
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Update testimonial
  async updateTestimonial(id, testimonialData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/testimonials/${id}`, testimonialData, {
        headers: getAuthHeaders()
      });
      // Backend returns {success: true, data: testimonial}
      // Extract the data object directly
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
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
      return { success: false, error: error.message };
    }
  },

  // Toggle testimonial status (enable/disable)
  async toggleTestimonialStatus(id) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/testimonials/${id}/toggle`, {}, {
        headers: getAuthHeaders()
      });
      return { success: true, data: response.data.data || response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Upload image for testimonial
  async uploadImage(testimonialId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await axios.post(`${API_BASE_URL}/testimonials/${testimonialId}/upload-image`, formData, {
        headers: getAuthHeaders()
        // Don't set Content-Type for FormData - browser sets it automatically with boundary
      });
      // Backend returns {success: true, data: {imageUrl: "..."}}
      // Axios gives us response.data = {success: true, data: {imageUrl: "..."}}
      // So response.data.data = {imageUrl: "..."}
      // We return {success: true, data: {imageUrl: "..."}} so frontend can use response.data.imageUrl
      const responseData = response.data.data || response.data;
      return { success: true, data: responseData };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  // Get presigned URL for S3 image
  async getPresignedImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    // Skip presigned URL for localhost/local URLs (these are old testimonials)
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
      // console.warn('Failed to get presigned URL, using original:', error);
      // If auth fails, return original URL (might work if bucket is public)
    }
    
    // Fallback to original URL
    return imageUrl;
  }
};

export default testimonialService;