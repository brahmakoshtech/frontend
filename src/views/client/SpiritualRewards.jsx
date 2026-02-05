import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import { 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  GiftIcon,
  StarIcon,
  ArrowLeftIcon
} from '@heroicons/vue/24/outline';
import spiritualRewardsService from '../../services/spiritualRewardsService.js';

export default {
  name: 'SpiritualRewards',
  setup() {
    const toast = useToast();
    const router = useRouter();
    const loading = ref(false);
    const rewards = ref([]);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const activeDropdown = ref(null);
    const selectedReward = ref(null);
    const editingReward = ref(null);

    const newReward = ref({
      title: '',
      description: '',
      category: '',
      photo: null,
      banner: null,
      karmaPointsRequired: 0,
      numberOfDevotees: 0,
      devoteeMessage: '',
      greetings: ''
    });

    const editForm = ref({
      title: '',
      description: '',
      category: '',
      photo: null,
      banner: null,
      karmaPointsRequired: 0,
      numberOfDevotees: 0,
      devoteeMessage: '',
      greetings: ''
    });

    const categories = [
      'Spiritual Books',
      'Prayer Items',
      'Meditation Tools',
      'Sacred Jewelry',
      'Temple Visits',
      'Blessings',
      'Other'
    ];

    const photoUploaded = ref(false);
    const photoFileName = ref('');
    const bannerUploaded = ref(false);
    const bannerFileName = ref('');
    const editPhotoUploaded = ref(false);
    const editPhotoFileName = ref('');
    const editBannerUploaded = ref(false);
    const editBannerFileName = ref('');
    const photoUploadProgress = ref(0);
    const bannerUploadProgress = ref(0);
    const editPhotoUploadProgress = ref(0);
    const editBannerUploadProgress = ref(0);
    const photoUploading = ref(false);
    const bannerUploading = ref(false);
    const editPhotoUploading = ref(false);
    const editBannerUploading = ref(false);

    const handlePhotoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newReward.value.photo = file;
        photoUploaded.value = true;
        photoFileName.value = file.name;
      }
    };

    const handleBannerUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newReward.value.banner = file;
        bannerUploaded.value = true;
        bannerFileName.value = file.name;
      }
    };

    const handleEditPhotoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editForm.value.photo = file;
        editPhotoUploaded.value = true;
        editPhotoFileName.value = file.name;
      }
    };

    const handleEditBannerUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editForm.value.banner = file;
        editBannerUploaded.value = true;
        editBannerFileName.value = file.name;
      }
    };

    const toggleDropdown = (rewardId) => {
      activeDropdown.value = activeDropdown.value === rewardId ? null : rewardId;
    };

    const viewReward = (reward) => {
      selectedReward.value = reward;
      showViewModal.value = true;
      activeDropdown.value = null;
    };

    const editReward = (reward) => {
      editingReward.value = reward;
      editForm.value = { ...reward };
      editPhotoUploaded.value = false;
      editPhotoFileName.value = '';
      editBannerUploaded.value = false;
      editBannerFileName.value = '';
      showEditModal.value = true;
      activeDropdown.value = null;
    };

    // Toggle reward status with backend
    const toggleRewardStatus = async (reward) => {
      try {
        const response = await spiritualRewardsService.toggleReward(reward._id);
        if (response.success) {
          const index = rewards.value.findIndex(r => r._id === reward._id);
          if (index !== -1) {
            rewards.value[index].isActive = response.data.isActive;
          }
          toast.success(`Reward ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        } else {
          toast.error(response.message || 'Failed to toggle reward status');
        }
      } catch (error) {
        console.error('Toggle reward error:', error);
        toast.error('Failed to toggle reward status');
      }
      activeDropdown.value = null;
    };

    // Delete reward with backend
    const deleteReward = async (rewardId) => {
      if (confirm('Are you sure you want to delete this reward?')) {
        try {
          loading.value = true;
          const response = await spiritualRewardsService.deleteReward(rewardId);
          if (response.success) {
            rewards.value = rewards.value.filter(r => r._id !== rewardId);
            toast.success('Reward deleted successfully!');
          } else {
            toast.error(response.message || 'Failed to delete reward');
          }
        } catch (error) {
          console.error('Delete reward error:', error);
          toast.error('Failed to delete reward');
        } finally {
          loading.value = false;
        }
        activeDropdown.value = null;
      }
    };

    const openAddModal = () => {
      showAddModal.value = true;
    };

    const closeAddModal = () => {
      showAddModal.value = false;
      newReward.value = {
        title: '',
        description: '',
        category: '',
        photo: null,
        banner: null,
        karmaPointsRequired: 0,
        numberOfDevotees: 0,
        devoteeMessage: '',
        greetings: ''
      };
      photoUploaded.value = false;
      photoFileName.value = '';
      bannerUploaded.value = false;
      bannerFileName.value = '';
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      editingReward.value = null;
      editForm.value = {
        title: '',
        description: '',
        category: '',
        photo: null,
        banner: null,
        karmaPointsRequired: 0,
        numberOfDevotees: 0,
        devoteeMessage: '',
        greetings: ''
      };
      editPhotoUploaded.value = false;
      editPhotoFileName.value = '';
      editBannerUploaded.value = false;
      editBannerFileName.value = '';
    };

    const addReward = async () => {
      if (!newReward.value.title || !newReward.value.description || !newReward.value.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      try {
        loading.value = true;
        
        let photoUrl = null;
        let bannerUrl = null;
        
        // Upload photo if provided
        if (newReward.value.photo) {
          try {
            photoUploading.value = true;
            photoUploadProgress.value = 0;
            
            const { uploadUrl, fileUrl } = await spiritualRewardsService.getUploadUrl(
              newReward.value.photo.name,
              newReward.value.photo.type,
              'photo'
            );
            
            await spiritualRewardsService.uploadToS3(
              uploadUrl,
              newReward.value.photo,
              (progress) => {
                photoUploadProgress.value = Math.round(progress);
              }
            );
            
            photoUrl = fileUrl;
            photoUploading.value = false;
          } catch (error) {
            console.error('Photo upload failed:', error);
            toast.error('Photo upload failed: ' + (error.message || 'Unknown error'));
            photoUploading.value = false;
            loading.value = false;
            return;
          }
        }
        
        // Upload banner if provided
        if (newReward.value.banner) {
          try {
            bannerUploading.value = true;
            bannerUploadProgress.value = 0;
            
            const { uploadUrl, fileUrl } = await spiritualRewardsService.getUploadUrl(
              newReward.value.banner.name,
              newReward.value.banner.type,
              'banner'
            );
            
            await spiritualRewardsService.uploadToS3(
              uploadUrl,
              newReward.value.banner,
              (progress) => {
                bannerUploadProgress.value = Math.round(progress);
              }
            );
            
            bannerUrl = fileUrl;
            bannerUploading.value = false;
          } catch (error) {
            console.error('Banner upload failed:', error);
            toast.error('Banner upload failed: ' + (error.message || 'Unknown error'));
            bannerUploading.value = false;
            loading.value = false;
            return;
          }
        }
        
        // Create reward with uploaded URLs
        const rewardData = {
          title: newReward.value.title,
          description: newReward.value.description,
          category: newReward.value.category,
          karmaPointsRequired: newReward.value.karmaPointsRequired,
          numberOfDevotees: newReward.value.numberOfDevotees,
          devoteeMessage: newReward.value.devoteeMessage,
          greetings: newReward.value.greetings,
          photoUrl,
          bannerUrl,
          photoKey: photoUrl ? photoUrl.split('.amazonaws.com/')[1]?.split('?')[0] : null,
          bannerKey: bannerUrl ? bannerUrl.split('.amazonaws.com/')[1]?.split('?')[0] : null
        };
        
        const response = await spiritualRewardsService.createReward(rewardData);
        
        if (response.success) {
          await fetchRewards();
          closeAddModal();
          toast.success('Reward added successfully!');
        } else {
          toast.error(response.message || 'Failed to create reward');
        }
      } catch (error) {
        console.error('Error creating reward:', error);
        toast.error('Failed to create reward');
      } finally {
        loading.value = false;
        photoUploading.value = false;
        bannerUploading.value = false;
      }
    };

    const updateReward = async () => {
      if (!editForm.value.title || !editForm.value.description || !editForm.value.category) {
        toast.error('Please fill in all required fields');
        return;
      }

      try {
        loading.value = true;
        
        let photoUrl = null;
        let bannerUrl = null;
        
        // Upload photo if new file provided
        if (editForm.value.photo && editForm.value.photo instanceof File) {
          try {
            editPhotoUploading.value = true;
            editPhotoUploadProgress.value = 0;
            
            const { uploadUrl, fileUrl } = await spiritualRewardsService.getUploadUrl(
              editForm.value.photo.name,
              editForm.value.photo.type,
              'photo'
            );
            
            await spiritualRewardsService.uploadToS3(
              uploadUrl,
              editForm.value.photo,
              (progress) => {
                editPhotoUploadProgress.value = Math.round(progress);
              }
            );
            
            photoUrl = fileUrl;
            editPhotoUploading.value = false;
          } catch (error) {
            console.error('Photo upload failed:', error);
            toast.error('Photo upload failed: ' + (error.message || 'Unknown error'));
            editPhotoUploading.value = false;
            loading.value = false;
            return;
          }
        }
        
        // Upload banner if new file provided
        if (editForm.value.banner && editForm.value.banner instanceof File) {
          try {
            editBannerUploading.value = true;
            editBannerUploadProgress.value = 0;
            
            const { uploadUrl, fileUrl } = await spiritualRewardsService.getUploadUrl(
              editForm.value.banner.name,
              editForm.value.banner.type,
              'banner'
            );
            
            await spiritualRewardsService.uploadToS3(
              uploadUrl,
              editForm.value.banner,
              (progress) => {
                editBannerUploadProgress.value = Math.round(progress);
              }
            );
            
            bannerUrl = fileUrl;
            editBannerUploading.value = false;
          } catch (error) {
            console.error('Banner upload failed:', error);
            toast.error('Banner upload failed: ' + (error.message || 'Unknown error'));
            editBannerUploading.value = false;
            loading.value = false;
            return;
          }
        }
        
        // Update reward data
        const updateData = {
          title: editForm.value.title,
          description: editForm.value.description,
          category: editForm.value.category,
          karmaPointsRequired: editForm.value.karmaPointsRequired,
          numberOfDevotees: editForm.value.numberOfDevotees,
          devoteeMessage: editForm.value.devoteeMessage,
          greetings: editForm.value.greetings
        };
        
        // Add URLs if files were uploaded
        if (photoUrl) {
          updateData.photoUrl = photoUrl;
          updateData.photoKey = photoUrl.split('.amazonaws.com/')[1]?.split('?')[0];
        }
        if (bannerUrl) {
          updateData.bannerUrl = bannerUrl;
          updateData.bannerKey = bannerUrl.split('.amazonaws.com/')[1]?.split('?')[0];
        }
        
        const response = await spiritualRewardsService.updateReward(editingReward.value._id, updateData);
        
        if (response.success) {
          await fetchRewards();
          closeEditModal();
          toast.success('Reward updated successfully!');
        } else {
          toast.error(response.message || 'Failed to update reward');
        }
      } catch (error) {
        console.error('Error updating reward:', error);
        toast.error('Failed to update reward');
      } finally {
        loading.value = false;
        editPhotoUploading.value = false;
        editBannerUploading.value = false;
      }
    };

    // Helper function to clean malformed S3 URLs
    const cleanS3Url = (url) => {
      if (!url) return null;
      // Fix double slashes in S3 URLs
      if (url.includes('amazonaws.com/') && url.split('/').length > 5) {
        const parts = url.split('/');
        const bucketIndex = parts.findIndex(part => part.includes('.s3.'));
        if (bucketIndex > 0) {
          const cleanPath = parts.slice(bucketIndex + 1).join('/');
          return `https://${parts[bucketIndex]}/${cleanPath}`;
        }
      }
      return url;
    };

    // Fetch rewards from backend
    const fetchRewards = async () => {
      try {
        loading.value = true;
        const response = await spiritualRewardsService.getAllRewards();
        if (response.success) {
          rewards.value = response.data;
          console.log('Fetched rewards:', response.data); // Debug log
        } else {
          toast.error(response.message || 'Failed to fetch rewards');
        }
      } catch (error) {
        console.error('Fetch rewards error:', error);
        toast.error('Failed to fetch rewards');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchRewards();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <style>{`
          .reward-card {
            transition: all 0.3s ease;
            border-radius: 16px;
          }
          .reward-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
          }
        `}</style>
        
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="bg-gradient-primary rounded-4 p-4 mb-4 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3 d-flex align-items-center gap-2"
                  onClick={() => router.push('/client/spiritual-checkin')}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                  Back
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2 text-dark d-flex align-items-center gap-2">
                    <GiftIcon style={{ width: '2rem', height: '2rem', color: '#8b5cf6' }} />
                    Spiritual Rewards
                  </h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>
                    Manage karma-based rewards for devotees
                  </p>
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={openAddModal}
                  disabled={loading.value}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  Add Reward
                </button>
              </div>
            </div>

            {/* Rewards Grid */}
            {rewards.value.length > 0 ? (
              <div class="row g-4">
                {rewards.value.map(reward => (
                  <div key={reward._id} class="col-xl-4 col-lg-6 col-md-6">
                    <div class={`card h-100 border-0 shadow-sm ${!reward.isActive ? 'opacity-50' : ''}`} style={{ borderRadius: '12px' }}>
                      {/* Banner Image */}
                      {reward.banner && (
                        <div class="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                          <img 
                            src={reward.banner} 
                            alt={reward.title}
                            class="w-100 h-100"
                            style={{ objectFit: 'cover', borderRadius: '12px 12px 0 0' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      {!reward.isActive && (
                        <div class="position-absolute top-0 start-0 m-3" style={{ zIndex: 1 }}>
                          <span class="badge bg-secondary px-2 py-1 rounded-pill">Disabled</span>
                        </div>
                      )}
                      
                      {/* Dropdown Menu */}
                      <div class="position-absolute top-0 end-0 m-3" style={{ zIndex: 2 }}>
                        <div class="dropdown">
                          <button 
                            class="btn btn-light btn-sm rounded-circle"
                            onClick={() => toggleDropdown(reward._id)}
                            style={{ width: '32px', height: '32px' }}
                          >
                            <EllipsisVerticalIcon style={{ width: '1rem', height: '1rem' }} />
                          </button>
                          {activeDropdown.value === reward._id && (
                            <div class="dropdown-menu show position-absolute shadow-lg" style={{ right: '0', zIndex: 1000 }}>
                              {reward.isActive ? (
                                <>
                                  <button class="dropdown-item" onClick={() => viewReward(reward)}>
                                    <EyeIcon style={{ width: '1rem', height: '1rem' }} class="me-2" />
                                    View Details
                                  </button>
                                  <button class="dropdown-item" onClick={() => editReward(reward)}>
                                    <PencilIcon style={{ width: '1rem', height: '1rem' }} class="me-2" />
                                    Edit Reward
                                  </button>
                                  <button class="dropdown-item" onClick={() => toggleRewardStatus(reward)}>
                                    <span class="rounded-circle bg-warning me-2" style={{ width: '1rem', height: '1rem', display: 'inline-block' }}></span>
                                    Disable
                                  </button>
                                  <hr class="dropdown-divider" />
                                  <button class="dropdown-item text-danger" onClick={() => deleteReward(reward._id)}>
                                    <TrashIcon style={{ width: '1rem', height: '1rem' }} class="me-2" />
                                    Delete
                                  </button>
                                </>
                              ) : (
                                <button class="dropdown-item" onClick={() => toggleRewardStatus(reward)}>
                                  <span class="rounded-circle bg-success me-2" style={{ width: '1rem', height: '1rem', display: 'inline-block' }}></span>
                                  Enable
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div class="card-body p-4">
                        {/* Photo and Title Section */}
                        <div class="d-flex align-items-start gap-3 mb-3">
                          {/* Photo */}
                          {reward.image && (
                            <img 
                              src={reward.image} 
                              alt={reward.title}
                              class="rounded-3 flex-shrink-0"
                              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            />
                          )}
                          
                          {/* Title and Category */}
                          <div class="flex-grow-1">
                            <h5 class="card-title fw-bold mb-1">{reward.title}</h5>
                            <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 small">
                              {reward.category}
                            </span>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p class="card-text text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                          {reward.description}
                        </p>

                        {/* Karma Points Required */}
                        <div class="mb-2">
                          <div class="d-flex align-items-center">
                            <StarIcon style={{ width: '1rem', height: '1rem', color: '#ffc107' }} class="me-1" />
                            <small class="fw-semibold">{reward.karmaPointsRequired} Karma Points Required</small>
                          </div>
                        </div>

                        {/* Number of Devotees */}
                        <div class="mb-3">
                          <small class="text-muted">{reward.numberOfDevotees} devotees</small>
                        </div>

                        {/* Devotee Message */}
                        {reward.devoteeMessage && (
                          <div class="mb-2">
                            <small class="text-muted d-block"><strong>Message:</strong> {reward.devoteeMessage}</small>
                          </div>
                        )}

                        {/* Greetings */}
                        {reward.greetings && (
                          <div class="mb-2">
                            <small class="text-success d-block"><strong>Greetings:</strong> {reward.greetings}</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-center py-5">
                <GiftIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} class="mb-3" />
                <h4 class="fw-bold mb-2">No Rewards Yet</h4>
                <p class="text-muted mb-4">Create your first spiritual reward</p>
                <button class="btn btn-primary rounded-pill px-4" onClick={openAddModal}>
                  Add First Reward
                </button>
              </div>
            )}

            {/* Add Reward Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                      <h5 class="modal-title fw-bold">Add New Reward</h5>
                      <button class="btn-close btn-close-white" onClick={closeAddModal}></button>
                    </div>
                    <div class="modal-body p-4">
                      <div class="row g-3">
                        <div class="col-12">
                          <label class="form-label fw-semibold">Rewards Title *</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            value={newReward.value.title}
                            onInput={(e) => newReward.value.title = e.target.value}
                            placeholder="Enter reward title"
                          />
                        </div>
                        
                        <div class="col-12">
                          <label class="form-label fw-semibold">Description *</label>
                          <textarea 
                            class="form-control" 
                            rows="3"
                            value={newReward.value.description}
                            onInput={(e) => newReward.value.description = e.target.value}
                            placeholder="Describe the reward..."
                          ></textarea>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Category *</label>
                          <select 
                            class="form-select"
                            value={newReward.value.category}
                            onChange={(e) => newReward.value.category = e.target.value}
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Karma Points Required *</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            value={newReward.value.karmaPointsRequired}
                            onInput={(e) => newReward.value.karmaPointsRequired = parseInt(e.target.value) || 0}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Photo</label>
                          <input 
                            type="file" 
                            class="form-control" 
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={photoUploading.value}
                          />
                          {photoUploaded.value && (
                            <small class="text-success mt-1 d-block">✓ {photoFileName.value}</small>
                          )}
                          {photoUploading.value && (
                            <div class="mt-2">
                              <div class="progress" style={{ height: '4px' }}>
                                <div 
                                  class="progress-bar bg-primary" 
                                  style={{ width: `${photoUploadProgress.value}%` }}
                                ></div>
                              </div>
                              <small class="text-primary mt-1 d-block">Uploading photo... {photoUploadProgress.value}%</small>
                            </div>
                          )}
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Banner</label>
                          <input 
                            type="file" 
                            class="form-control" 
                            accept="image/*"
                            onChange={handleBannerUpload}
                            disabled={bannerUploading.value}
                          />
                          {bannerUploaded.value && (
                            <small class="text-success mt-1 d-block">✓ {bannerFileName.value}</small>
                          )}
                          {bannerUploading.value && (
                            <div class="mt-2">
                              <div class="progress" style={{ height: '4px' }}>
                                <div 
                                  class="progress-bar bg-primary" 
                                  style={{ width: `${bannerUploadProgress.value}%` }}
                                ></div>
                              </div>
                              <small class="text-primary mt-1 d-block">Uploading banner... {bannerUploadProgress.value}%</small>
                            </div>
                          )}
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">No of Devotees</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            value={newReward.value.numberOfDevotees}
                            onInput={(e) => newReward.value.numberOfDevotees = parseInt(e.target.value) || 0}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        
                        <div class="col-12">
                          <label class="form-label fw-semibold">Devotee Message</label>
                          <textarea 
                            class="form-control" 
                            rows="2"
                            value={newReward.value.devoteeMessage}
                            onInput={(e) => newReward.value.devoteeMessage = e.target.value}
                            placeholder="Message for devotees..."
                          ></textarea>
                        </div>
                        
                        <div class="col-12">
                          <label class="form-label fw-semibold">What Happened Next (Greetings)</label>
                          <textarea 
                            class="form-control" 
                            rows="3"
                            value={newReward.value.greetings}
                            onInput={(e) => newReward.value.greetings = e.target.value}
                            placeholder="Congratulations message and next steps..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={closeAddModal}>Cancel</button>
                      <button 
                        class="btn btn-primary" 
                        onClick={addReward}
                        disabled={!newReward.value.title || !newReward.value.description || !newReward.value.category || loading.value || photoUploading.value || bannerUploading.value}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {photoUploading.value ? 'Uploading Photo...' : bannerUploading.value ? 'Uploading Banner...' : 'Adding Reward...'}
                          </>
                        ) : (
                          'Add Reward'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Reward Modal */}
            {showEditModal.value && editingReward.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                      <h5 class="modal-title fw-bold">Edit Reward</h5>
                      <button class="btn-close btn-close-white" onClick={closeEditModal}></button>
                    </div>
                    <div class="modal-body p-4">
                      <div class="row g-3">
                        <div class="col-12">
                          <label class="form-label fw-semibold">Rewards Title *</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            value={editForm.value.title}
                            onInput={(e) => editForm.value.title = e.target.value}
                            placeholder="Enter reward title"
                          />
                        </div>
                        
                        <div class="col-12">
                          <label class="form-label fw-semibold">Description *</label>
                          <textarea 
                            class="form-control" 
                            rows="3"
                            value={editForm.value.description}
                            onInput={(e) => editForm.value.description = e.target.value}
                            placeholder="Describe the reward..."
                          ></textarea>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Category *</label>
                          <select 
                            class="form-select"
                            value={editForm.value.category}
                            onChange={(e) => editForm.value.category = e.target.value}
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Karma Points Required *</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            value={editForm.value.karmaPointsRequired}
                            onInput={(e) => editForm.value.karmaPointsRequired = parseInt(e.target.value) || 0}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Photo</label>
                          <input 
                            type="file" 
                            class="form-control" 
                            accept="image/*"
                            onChange={handleEditPhotoUpload}
                            disabled={editPhotoUploading.value}
                          />
                          {editPhotoUploaded.value && (
                            <small class="text-success mt-1 d-block">✓ {editPhotoFileName.value}</small>
                          )}
                          {editPhotoUploading.value && (
                            <div class="mt-2">
                              <div class="progress" style={{ height: '4px' }}>
                                <div 
                                  class="progress-bar bg-primary" 
                                  style={{ width: `${editPhotoUploadProgress.value}%` }}
                                ></div>
                              </div>
                              <small class="text-primary mt-1 d-block">Uploading photo... {editPhotoUploadProgress.value}%</small>
                            </div>
                          )}
                          {editingReward.value?.photoUrl && !editPhotoUploaded.value && (
                            <small class="text-info mt-1 d-block">📷 Current photo will be kept if no new photo is selected</small>
                          )}
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Banner</label>
                          <input 
                            type="file" 
                            class="form-control" 
                            accept="image/*"
                            onChange={handleEditBannerUpload}
                            disabled={editBannerUploading.value}
                          />
                          {editBannerUploaded.value && (
                            <small class="text-success mt-1 d-block">✓ {editBannerFileName.value}</small>
                          )}
                          {editBannerUploading.value && (
                            <div class="mt-2">
                              <div class="progress" style={{ height: '4px' }}>
                                <div 
                                  class="progress-bar bg-primary" 
                                  style={{ width: `${editBannerUploadProgress.value}%` }}
                                ></div>
                              </div>
                              <small class="text-primary mt-1 d-block">Uploading banner... {editBannerUploadProgress.value}%</small>
                            </div>
                          )}
                          {editingReward.value?.bannerUrl && !editBannerUploaded.value && (
                            <small class="text-info mt-1 d-block">🎨 Current banner will be kept if no new banner is selected</small>
                          )}
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">No of Devotees</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            value={editForm.value.numberOfDevotees}
                            onInput={(e) => editForm.value.numberOfDevotees = parseInt(e.target.value) || 0}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        
                        <div class="col-12">
                          <label class="form-label fw-semibold">Devotee Message</label>
                          <textarea 
                            class="form-control" 
                            rows="2"
                            value={editForm.value.devoteeMessage}
                            onInput={(e) => editForm.value.devoteeMessage = e.target.value}
                            placeholder="Message for devotees..."
                          ></textarea>
                        </div>
                        
                        <div class="col-12">
                          <label class="form-label fw-semibold">What Happened Next (Greetings)</label>
                          <textarea 
                            class="form-control" 
                            rows="3"
                            value={editForm.value.greetings}
                            onInput={(e) => editForm.value.greetings = e.target.value}
                            placeholder="Congratulations message and next steps..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                      <button 
                        class="btn btn-primary" 
                        onClick={updateReward}
                        disabled={!editForm.value.title || !editForm.value.description || !editForm.value.category || loading.value || editPhotoUploading.value || editBannerUploading.value}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {editPhotoUploading.value ? 'Uploading Photo...' : editBannerUploading.value ? 'Uploading Banner...' : 'Updating Reward...'}
                          </>
                        ) : (
                          'Update Reward'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Reward Modal */}
            {showViewModal.value && selectedReward.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                      <h5 class="modal-title fw-bold">Reward Details</h5>
                      <button class="btn-close btn-close-white" onClick={() => showViewModal.value = false}></button>
                    </div>
                    <div class="modal-body p-4">
                      {/* Banner Image */}
                      {selectedReward.value.bannerUrl && (
                        <div class="mb-4">
                          <img 
                            src={cleanS3Url(selectedReward.value.bannerUrl)} 
                            alt={selectedReward.value.title}
                            class="w-100 rounded-3"
                            style={{ maxHeight: '200px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      
                      <div class="row g-3">
                        <div class="col-12">
                          <div class="d-flex align-items-start gap-3">
                            {/* Photo */}
                            {selectedReward.value.photoUrl && (
                              <img 
                                src={cleanS3Url(selectedReward.value.photoUrl)} 
                                alt={selectedReward.value.title}
                                class="rounded-3"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              />
                            )}
                            <div>
                              <h4 class="fw-bold text-primary">{selectedReward.value.title}</h4>
                              <p class="text-muted">{selectedReward.value.description}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold text-muted">Category</label>
                          <p class="mb-0">
                            <span class="badge bg-info bg-opacity-10 text-info px-2 py-1">
                              {selectedReward.value.category}
                            </span>
                          </p>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold text-muted">Karma Points Required</label>
                          <p class="mb-0 d-flex align-items-center">
                            <StarIcon style={{ width: '1rem', height: '1rem', color: '#ffc107' }} class="me-1" />
                            <span class="fw-bold">{selectedReward.value.karmaPointsRequired} Points</span>
                          </p>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold text-muted">Number of Devotees</label>
                          <p class="mb-0 fw-semibold">{selectedReward.value.numberOfDevotees}</p>
                        </div>
                        
                        <div class="col-md-6">
                          <label class="form-label fw-semibold text-muted">Status</label>
                          <p class="mb-0">
                            <span class={`badge ${selectedReward.value.isActive ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                              {selectedReward.value.isActive ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </p>
                        </div>
                        
                        {selectedReward.value.devoteeMessage && (
                          <div class="col-12">
                            <label class="form-label fw-semibold text-muted">Devotee Message</label>
                            <div class="p-3 bg-light rounded">
                              <p class="mb-0 fst-italic">"{selectedReward.value.devoteeMessage}"</p>
                            </div>
                          </div>
                        )}
                        
                        {selectedReward.value.greetings && (
                          <div class="col-12">
                            <label class="form-label fw-semibold text-muted">What Happened Next (Greetings)</label>
                            <div class="p-3 bg-success bg-opacity-10 rounded border border-success border-opacity-25">
                              <p class="mb-0 text-success">{selectedReward.value.greetings}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => showViewModal.value = false}>Close</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};