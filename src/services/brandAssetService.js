import api from './api.js';

const brandAssetService = {
  // Get all brand assets for authenticated client
  getAllBrandAssets: async () => {
    try {
      const response = await api.request('/brand-assets');
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Error fetching brand assets:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch brand assets'
      };
    }
  },

  // Get single brand asset by ID
  getBrandAsset: async (id) => {
    try {
      const response = await api.request(`/brand-assets/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching brand asset:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch brand asset'
      };
    }
  },

  // Create new brand asset
  createBrandAsset: async (brandAssetData) => {
    try {
      const response = await api.request('/brand-assets', {
        method: 'POST',
        body: brandAssetData
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating brand asset:', error);
      return {
        success: false,
        error: error.message || 'Failed to create brand asset'
      };
    }
  },

  // Update brand asset
  updateBrandAsset: async (id, brandAssetData) => {
    try {
      const response = await api.request(`/brand-assets/${id}`, {
        method: 'PUT',
        body: brandAssetData
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating brand asset:', error);
      return {
        success: false,
        error: error.message || 'Failed to update brand asset'
      };
    }
  },

  // Delete brand asset
  deleteBrandAsset: async (id) => {
    try {
      const response = await api.request(`/brand-assets/${id}`, {
        method: 'DELETE'
      });
      return {
        success: true,
        message: response.message
      };
    } catch (error) {
      console.error('Error deleting brand asset:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete brand asset'
      };
    }
  },

  // Upload image for brand asset
  uploadImage: async (id, imageFile) => {
    try {
      const formData = new FormData();
      formData.append('brandLogoImage', imageFile);

      // Get client token for brand asset image upload
      const token = localStorage.getItem('token_client');

      const response = await fetch(`${api.baseURL}/brand-assets/${id}/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Image upload failed');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  },

  // Toggle brand asset status (activate/deactivate)
  toggleBrandAssetStatus: async (id) => {
    try {
      const response = await api.request(`/brand-assets/${id}/toggle`, {
        method: 'PATCH'
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error toggling brand asset status:', error);
      return {
        success: false,
        error: error.message || 'Failed to toggle brand asset status'
      };
    }
  },

  // Get presigned URL for S3 image (similar to testimonial service)
  getPresignedImageUrl: async (imageUrl) => {
    try {
      if (!imageUrl || !imageUrl.includes('amazonaws.com')) {
        return imageUrl;
      }

      // Extract key from S3 URL
      const url = new URL(imageUrl);
      const key = url.pathname.substring(1);

      const response = await api.request(`/upload/presigned-url?key=${encodeURIComponent(key)}`);
      return response.url || imageUrl;
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      return imageUrl;
    }
  }
};

export default brandAssetService;