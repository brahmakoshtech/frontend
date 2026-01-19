import api from './api';

const liveAvatarService = {
  // Get all live avatars (public endpoint for mobile users)
  getAllPublic: async () => {
    try {
      const response = await api.get('/live-avatars/public');
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all live avatars (authenticated endpoint)
  getAll: async () => {
    try {
      const response = await api.get('/live-avatars');
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single live avatar
  getById: async (id) => {
    try {
      const response = await api.get(`/live-avatars/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create live avatar with direct S3 URLs
  createDirect: async (data) => {
    try {
      const response = await api.post('/live-avatars/direct', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update live avatar with direct S3 URLs
  updateDirect: async (id, data) => {
    try {
      const response = await api.put(`/live-avatars/${id}/direct`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete live avatar
  delete: async (id) => {
    try {
      const response = await api.delete(`/live-avatars/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle live avatar status
  toggleStatus: async (id) => {
    try {
      const response = await api.patch(`/live-avatars/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get presigned URL for direct S3 upload
  getUploadUrl: async (fileName, contentType, fileType) => {
    try {
      const response = await api.post('/live-avatars/upload-url', {
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
  }
};

export default liveAvatarService;