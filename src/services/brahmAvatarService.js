import api from './api';

export const brahmAvatarService = {
  // Get all brahm avatars
  getBrahmAvatars: (includeInactive = false) => {
    return api.get(`/brahm-avatars?includeInactive=${includeInactive}`);
  },

  // Get single brahm avatar
  getBrahmAvatar: (id) => {
    return api.get(`/brahm-avatars/${id}`);
  },

  // Create new brahm avatar
  createBrahmAvatar: (data) => {
    return api.post('/brahm-avatars/direct', data);
  },

  // Update brahm avatar
  updateBrahmAvatar: (id, data) => {
    return api.put(`/brahm-avatars/${id}/direct`, data);
  },

  // Toggle active status
  toggleBrahmAvatar: (id) => {
    return api.patch(`/brahm-avatars/${id}/toggle-status`);
  },

  // Delete brahm avatar
  deleteBrahmAvatar: (id) => {
    return api.delete(`/brahm-avatars/${id}`);
  },

  // Get upload URL for S3
  getUploadUrl: (data) => {
    return api.post('/brahm-avatars/upload-url', data);
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

  // Increment views
  incrementViews: (id) => {
    return api.patch(`/brahm-avatars/${id}/views`);
  },

  // Toggle like
  toggleLike: (id) => {
    return api.patch(`/brahm-avatars/${id}/like`);
  },

  // Increment shares
  incrementShares: (id) => {
    return api.patch(`/brahm-avatars/${id}/shares`);
  },
};