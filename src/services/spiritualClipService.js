import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_client') || 
                localStorage.getItem('token_user') || 
                localStorage.getItem('token_admin') || 
                localStorage.getItem('token_super_admin');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

const spiritualClipService = {
  // Get all clips
  getAllClips: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append('type', params.type);
      
      const url = queryParams.toString() ? `/spiritual-clips?${queryParams}` : '/spiritual-clips';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0
      };
    } catch (error) {
      console.error('Get clips error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch clips',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Get presigned URL for direct S3 upload
  getUploadUrl: async (fileName, contentType, fileType) => {
    try {
      const response = await api.post('/spiritual-clips/upload-url', {
        fileName,
        contentType,
        fileType
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload file directly to S3
  uploadToS3: async (uploadUrl, file, onProgress) => {
    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });
        
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } catch (error) {
      throw error;
    }
  },

  // Create clip with direct S3 URLs
  createClipDirect: async (data) => {
    try {
      const response = await api.post('/spiritual-clips/direct', data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Clip created successfully'
      };
    } catch (error) {
      console.error('Create clip error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create clip',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Create new clip
  createClip: async (clipData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', clipData.title);
      formData.append('description', clipData.description);
      formData.append('suitableTime', clipData.suitableTime || '');
      formData.append('guided', clipData.guided || '');
      formData.append('transcript', clipData.transcript || '');
      formData.append('suitableConfiguration', clipData.suitableConfiguration || '');
      
      // Add video file if exists
      if (clipData.video) {
        formData.append('video', clipData.video);
      }
      
      // Add audio file if exists
      if (clipData.audio) {
        formData.append('audio', clipData.audio);
      }

      const response = await api.post('/spiritual-clips', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Clip created successfully'
      };
    } catch (error) {
      console.error('Create clip error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create clip',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Update clip with direct S3 URLs
  updateClipDirect: async (clipId, data) => {
    try {
      const response = await api.put(`/spiritual-clips/${clipId}/direct`, data);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Clip updated successfully'
      };
    } catch (error) {
      console.error('Update clip error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update clip',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Update clip
  updateClip: async (clipId, clipData) => {
    try {
      const formData = new FormData();
      
      // Add text fields
      if (clipData.title) formData.append('title', clipData.title);
      if (clipData.description) formData.append('description', clipData.description);
      if (clipData.suitableTime !== undefined) formData.append('suitableTime', clipData.suitableTime);
      if (clipData.guided !== undefined) formData.append('guided', clipData.guided);
      if (clipData.transcript !== undefined) formData.append('transcript', clipData.transcript);
      if (clipData.suitableConfiguration !== undefined) formData.append('suitableConfiguration', clipData.suitableConfiguration);
      if (clipData.type !== undefined) formData.append('type', clipData.type);
      
      // Add video file if exists
      if (clipData.video) {
        formData.append('video', clipData.video);
      }
      
      // Add audio file if exists
      if (clipData.audio) {
        formData.append('audio', clipData.audio);
      }

      const response = await api.put(`/spiritual-clips/${clipId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Clip updated successfully'
      };
    } catch (error) {
      console.error('Update clip error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update clip',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Toggle clip status
  toggleClip: async (clipId) => {
    try {
      const response = await api.patch(`/spiritual-clips/${clipId}/toggle`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Clip status updated successfully'
      };
    } catch (error) {
      console.error('Toggle clip error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle clip status',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Delete clip
  deleteClip: async (clipId) => {
    try {
      const response = await api.delete(`/spiritual-clips/${clipId}`);
      return {
        success: true,
        message: response.data.message || 'Clip deleted successfully'
      };
    } catch (error) {
      console.error('Delete clip error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete clip',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Get single clip
  getClip: async (clipId) => {
    try {
      const response = await api.get(`/spiritual-clips/${clipId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get clip error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch clip',
        error: error.response?.data?.error || error.message
      };
    }
  },

  // Get all clips for a specific configuration
  getSingleConfigurationAllClips: async (configId) => {
    try {
      const response = await api.get(`/spiritual-clips/configuration/${configId}`);
      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
        configurationId: response.data.configurationId
      };
    } catch (error) {
      console.error('Get clips by configuration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch clips for configuration',
        error: error.response?.data?.error || error.message
      };
    }
  }
};

export default spiritualClipService;