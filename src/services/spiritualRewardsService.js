import api from './api.js';

const spiritualRewardsService = {
  // Get all rewards
  getAllRewards: async () => {
    try {
      const response = await api.get('/spiritual-rewards');
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message
      };
    } catch (error) {
      console.error('Get rewards error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch rewards',
        data: []
      };
    }
  },

  // Create new reward
  createReward: async (rewardData) => {
    try {
      const response = await api.post('/spiritual-rewards', rewardData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Reward created successfully'
      };
    } catch (error) {
      console.error('Create reward error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create reward'
      };
    }
  },

  // Update reward
  updateReward: async (rewardId, rewardData) => {
    try {
      const response = await api.put(`/spiritual-rewards/${rewardId}`, rewardData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Reward updated successfully'
      };
    } catch (error) {
      console.error('Update reward error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update reward'
      };
    }
  },

  // Delete reward
  deleteReward: async (rewardId) => {
    try {
      const response = await api.delete(`/spiritual-rewards/${rewardId}`);
      return {
        success: true,
        message: response.data.message || 'Reward deleted successfully'
      };
    } catch (error) {
      console.error('Delete reward error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete reward'
      };
    }
  },

  // Toggle reward status
  toggleReward: async (rewardId) => {
    try {
      const response = await api.patch(`/spiritual-rewards/${rewardId}/toggle`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Reward status updated successfully'
      };
    } catch (error) {
      console.error('Toggle reward error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to toggle reward status'
      };
    }
  },

  // Get upload URL for images
  getUploadUrl: async (fileName, fileType, mediaType = 'image') => {
    try {
      const response = await api.post('/spiritual-rewards/upload-url', {
        fileName,
        fileType,
        mediaType
      });
      return {
        success: true,
        uploadUrl: response.data.uploadUrl,
        fileUrl: response.data.fileUrl
      };
    } catch (error) {
      console.error('Get upload URL error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get upload URL'
      };
    }
  },

  // Upload to S3
  uploadToS3: async (uploadUrl, file, onProgress) => {
    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
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
      console.error('S3 upload error:', error);
      throw error;
    }
  }
};

export default spiritualRewardsService;