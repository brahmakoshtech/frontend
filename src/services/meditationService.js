import api from './api';

const meditationService = {
  // Get all meditations
  getAll: async () => {
    try {
      const response = await api.get('/meditations');
      return response.data.data || response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get single meditation
  getById: async (id) => {
    try {
      const response = await api.get(`/meditations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create meditation
  create: async (formData) => {
    try {
      const response = await api.post('/meditations', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update meditation
  update: async (id, formData) => {
    try {
      const response = await api.put(`/meditations/${id}`, formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete meditation
  delete: async (id) => {
    try {
      const response = await api.delete(`/meditations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle meditation status
  toggleStatus: async (id) => {
    try {
      const response = await api.patch(`/meditations/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get presigned URL for direct S3 upload
  getUploadUrl: async (fileName, contentType, fileType) => {
    try {
      const response = await api.post('/meditations/upload-url', {
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

  // Create meditation with direct S3 URLs
  createDirect: async (data) => {
    try {
      const response = await api.post('/meditations/direct', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update meditation with direct S3 URLs
  updateDirect: async (id, data) => {
    try {
      const response = await api.put(`/meditations/${id}/direct`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default meditationService;