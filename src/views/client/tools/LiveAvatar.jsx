import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  VideoCameraIcon, 
  TrashIcon, 
  PencilIcon, 
  PlayIcon, 
  StopIcon, 
  EyeIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ChartBarIcon,
  SparklesIcon,
  AcademicCapIcon,
  BuildingLibraryIcon
} from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';
import liveAvatarService from '../../../services/liveAvatarService';

export default {
  name: 'ClientLiveAvatar',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const avatars = ref([]);
    
    const loading = ref(false);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const showMediaModal = ref(false);
    const selectedAvatar = ref(null);
    const mediaContent = ref({ type: '', url: '' });
    const openDropdownId = ref(null);
    const editingAvatar = ref(null);
    const uploadProgress = ref({ video: 0, image: 0 });
    const editUploadProgress = ref({ video: 0, image: 0 });
    const videoUploaded = ref(false);
    const videoFileName = ref('');
    const imageUploaded = ref(false);
    const imageFileName = ref('');
    const editVideoUploaded = ref(false);
    const editVideoFileName = ref('');
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');

    const newAvatar = ref({
      name: '',
      description: '',
      agentId: '',
      gender: 'Male',
      category: 'Deity',
      image: null,
      videos: null,
      link: ''
    });

    const loadAvatars = async () => {
      try {
        loading.value = true;
        const data = await liveAvatarService.getAll();
        avatars.value = data;
      } catch (error) {
        console.error('Error loading avatars:', error);
        toast.error('Error loading avatars');
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push('/client/tools');
    };

    const toggleDropdown = (avatarId) => {
      openDropdownId.value = openDropdownId.value === avatarId ? null : avatarId;
    };

    const viewContent = (avatar, type) => {
      // Disable content viewing if avatar is not active
      if (!avatar.isActive) {
        return;
      }
      
      if (type === 'video' && avatar.videoUrl) {
        mediaContent.value = { type: 'video', url: avatar.videoUrl };
        showMediaModal.value = true;
      } else if (type === 'image' && avatar.imageUrl) {
        mediaContent.value = { type: 'image', url: avatar.imageUrl };
        showMediaModal.value = true;
      } else if (type === 'link' && avatar.link) {
        window.open(avatar.link, '_blank');
      }
    };

    const closeMediaModal = () => {
      showMediaModal.value = false;
      mediaContent.value = { type: '', url: '' };
    };

    const openDescriptionModal = (avatar) => {
      selectedAvatar.value = avatar;
      showViewModal.value = true;
    };

    const openViewModal = (avatar) => {
      selectedAvatar.value = avatar;
      showViewModal.value = true;
    };

    const closeViewModal = () => {
      showViewModal.value = false;
      selectedAvatar.value = null;
    };

    const handleVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newAvatar.value.videos = file;
        videoUploaded.value = true;
        videoFileName.value = file.name;
      }
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newAvatar.value.image = file;
        imageUploaded.value = true;
        imageFileName.value = file.name;
      }
    };

    const handleEditVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editingAvatar.value.videos = file;
        editVideoUploaded.value = true;
        editVideoFileName.value = file.name;
      }
    };

    const handleEditImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editingAvatar.value.image = file;
        editImageUploaded.value = true;
        editImageFileName.value = file.name;
      }
    };

    const addAvatar = async () => {
      try {
        loading.value = true;
        uploadProgress.value = { video: 0, image: 0 };
        toast.info('Creating avatar...');
        
        let videoUrl = null;
        let imageUrl = null;
        
        // Upload video directly to S3 if provided
        if (newAvatar.value.videos) {
          try {
            const { uploadUrl, fileUrl } = await liveAvatarService.getUploadUrl(
              newAvatar.value.videos.name,
              newAvatar.value.videos.type,
              'video'
            );
            
            await liveAvatarService.uploadToS3(
              uploadUrl,
              newAvatar.value.videos,
              (progress) => {
                uploadProgress.value.video = Math.round(progress);
              }
            );
            
            videoUrl = fileUrl;
          } catch (error) {
            console.error('Video upload failed:', error);
            toast.error('Video upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Upload image directly to S3 if provided
        if (newAvatar.value.image) {
          try {
            const { uploadUrl, fileUrl } = await liveAvatarService.getUploadUrl(
              newAvatar.value.image.name,
              newAvatar.value.image.type,
              'image'
            );
            
            await liveAvatarService.uploadToS3(
              uploadUrl,
              newAvatar.value.image,
              (progress) => {
                uploadProgress.value.image = Math.round(progress);
              }
            );
            
            imageUrl = fileUrl;
          } catch (error) {
            console.error('Image upload failed:', error);
            toast.error('Image upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Create avatar with S3 URLs
        const response = await liveAvatarService.createDirect({
          name: newAvatar.value.name,
          description: newAvatar.value.description,
          agentId: newAvatar.value.agentId,
          gender: newAvatar.value.gender,
          category: newAvatar.value.category,
          link: newAvatar.value.link,
          videoUrl,
          imageUrl
        });
        
        // Add new avatar to list without reloading
        if (response.success && response.data) {
          avatars.value.unshift(response.data);
        }
        
        // Reset form
        newAvatar.value = { name: '', description: '', agentId: '', gender: 'Male', category: 'Deity', image: null, videos: null, link: '' };
        videoUploaded.value = false;
        videoFileName.value = '';
        imageUploaded.value = false;
        imageFileName.value = '';
        showAddModal.value = false;
        uploadProgress.value = { video: 0, image: 0 };
        toast.success('✓ Avatar created successfully!');
      } catch (error) {
        console.error('Error creating avatar:', error);
        toast.error('❌ Failed to create avatar. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const editAvatar = (avatar) => {
      editingAvatar.value = { ...avatar };
      editVideoUploaded.value = false;
      editVideoFileName.value = '';
      editImageUploaded.value = false;
      editImageFileName.value = '';
      showEditModal.value = true;
    };

    const updateAvatar = async () => {
      try {
        loading.value = true;
        editUploadProgress.value = { video: 0, image: 0 };
        toast.info('Updating avatar...');
        
        const updateData = {
          name: editingAvatar.value.name,
          description: editingAvatar.value.description,
          agentId: editingAvatar.value.agentId,
          gender: editingAvatar.value.gender,
          category: editingAvatar.value.category,
          link: editingAvatar.value.link
        };
        
        // Upload new video if provided
        if (editingAvatar.value.videos) {
          try {
            const { uploadUrl, fileUrl } = await liveAvatarService.getUploadUrl(
              editingAvatar.value.videos.name,
              editingAvatar.value.videos.type,
              'video'
            );
            
            await liveAvatarService.uploadToS3(
              uploadUrl,
              editingAvatar.value.videos,
              (progress) => {
                editUploadProgress.value.video = Math.round(progress);
              }
            );
            
            updateData.videoUrl = fileUrl;
          } catch (error) {
            console.error('Video upload failed:', error);
            toast.error('Video upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Upload new image if provided
        if (editingAvatar.value.image) {
          try {
            const { uploadUrl, fileUrl } = await liveAvatarService.getUploadUrl(
              editingAvatar.value.image.name,
              editingAvatar.value.image.type,
              'image'
            );
            
            await liveAvatarService.uploadToS3(
              uploadUrl,
              editingAvatar.value.image,
              (progress) => {
                editUploadProgress.value.image = Math.round(progress);
              }
            );
            
            updateData.imageUrl = fileUrl;
          } catch (error) {
            console.error('Image upload failed:', error);
            toast.error('Image upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Update avatar
        const response = await liveAvatarService.updateDirect(editingAvatar.value._id, updateData);
        
        // Update avatar in list without reloading
        if (response.success && response.data) {
          const index = avatars.value.findIndex(a => a._id === editingAvatar.value._id);
          if (index !== -1) {
            avatars.value[index] = response.data;
          }
        }
        
        showEditModal.value = false;
        editingAvatar.value = null;
        editUploadProgress.value = { video: 0, image: 0 };
        toast.success('✓ Avatar updated successfully!');
      } catch (error) {
        console.error('Error updating avatar:', error);
        toast.error('❌ Failed to update avatar. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const deleteAvatar = async (id) => {
      const confirmed = confirm('Are you sure you want to delete this avatar?');
      if (!confirmed) {
        toast.info('Delete cancelled');
        return;
      }
      
      try {
        loading.value = true;
        toast.info('Deleting avatar...');
        
        await liveAvatarService.delete(id);
        
        // Remove avatar from list without reloading
        avatars.value = avatars.value.filter(a => a._id !== id);
        
        toast.success('✓ Avatar deleted successfully!');
      } catch (error) {
        console.error('Error deleting avatar:', error);
        toast.error('❌ Failed to delete avatar. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const toggleAvatarStatus = async (avatar) => {
      try {
        const response = await liveAvatarService.toggleStatus(avatar._id);
        
        const index = avatars.value.findIndex(a => a._id === avatar._id);
        if (index !== -1) {
          avatars.value[index] = {
            ...avatars.value[index],
            isActive: response.data.isActive
          };
        }
        
        openDropdownId.value = null;
        toast.success(`✓ Avatar ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('Error toggling avatar status:', error);
        toast.error('❌ Failed to toggle avatar status. Please try again.');
      }
    };

    const startStream = (avatar) => {
      const index = avatars.value.findIndex(a => a._id === avatar._id);
      if (index !== -1) {
        avatars.value[index].status = 'active';
        avatars.value[index].viewers = Math.floor(Math.random() * 500) + 50;
      }
      toast.success('🔴 Stream started!');
    };

    const stopStream = (avatar) => {
      const index = avatars.value.findIndex(a => a._id === avatar._id);
      if (index !== -1) {
        avatars.value[index].status = 'offline';
        avatars.value[index].viewers = 0;
      }
      toast.success('⏹️ Stream stopped!');
    };

    onMounted(() => {
      loadAvatars();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
            .animate-pulse {
              animation: pulse 1s infinite;
            }
            .live-border {
              border: 3px solid #ff4757;
              box-shadow: 0 0 20px rgba(255, 71, 87, 0.5);
            }
            .live-border::before {
              content: '';
              position: absolute;
              top: -3px;
              left: -3px;
              right: -3px;
              bottom: -3px;
              background: linear-gradient(45deg, #ff4757, #ff6b7a, #ff4757);
              border-radius: inherit;
              z-index: -1;
              animation: pulse 2s infinite;
            }
          `}
        </style>
        <div class="row">
          <div class="col-12">
            {/* Enhanced Header */}
            <div class="bg-gradient-primary rounded-4 p-4 mb-4 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3" 
                  onClick={goBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                  <span class="d-none d-sm-inline">Back to Tools</span>
                  <span class="d-sm-none">Back</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2 text-dark">🎭 Live Avatar Management</h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>Create and manage interactive live avatar experiences</p>
                  {avatars.value.length > 0 && (
                    <small class="text-dark d-block mt-1" style={{ opacity: 0.8 }}>
                      <VideoCameraIcon style={{ width: '16px', height: '16px' }} class="me-1" />
                      {avatars.value.length} total avatars • {avatars.value.filter(a => a.status === 'active').length} active streams
                    </small>
                  )}
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={() => showAddModal.value = true}
                  disabled={loading.value}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span class="d-none d-sm-inline">Create Avatar</span>
                  <span class="d-sm-none">Create</span>
                </button>
              </div>
            </div>

            {/* Avatars List */}
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-3 p-md-4">
                <h5 class="fw-bold mb-3">Live Avatars</h5>
                {loading.value ? (
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : avatars.value.length > 0 ? (
                  <div class="row g-3">
                    {avatars.value.map(avatar => (
                      <div key={avatar._id} class="col-12 col-md-6 col-lg-4">
                        <div class={`card h-100 border-0 shadow-sm position-relative ${!avatar.isActive ? 'opacity-50' : ''}`} style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
                          {!avatar.isActive && (
                            <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, borderRadius: '16px', cursor: 'default' }}>
                              <span class="badge bg-secondary px-3 py-2 rounded-pill shadow d-flex align-items-center gap-2">
                                <XCircleIcon style={{ width: '16px', height: '16px' }} />
                                Disabled
                              </span>
                            </div>
                          )}
                          
                          {/* Card Media */}
                          <div class="position-relative" style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                            {avatar.imageUrl ? (
                              <img 
                                src={avatar.imageUrl} 
                                alt={avatar.name}
                                class="w-100 h-100"
                                style={{ objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => {
                                  mediaContent.value = { type: 'image', url: avatar.imageUrl };
                                  showMediaModal.value = true;
                                }}
                              />
                            ) : (
                              <div 
                                class="w-100 h-100 d-flex align-items-center justify-content-center bg-light"
                                style={{ color: '#6c757d' }}
                              >
                                <UserIcon style={{ width: '3rem', height: '3rem' }} />
                              </div>
                            )}
                          </div>
                          
                          <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="fw-bold mb-0 text-truncate" style={{ fontSize: '1rem' }}>{avatar.name}</h6>
                              <div class="dropdown position-relative">
                                <button 
                                  class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                  onClick={() => toggleDropdown(avatar._id)}
                                  style={{ width: '40px', height: '40px', position: 'relative', zIndex: 10 }}
                                >
                                  <EllipsisVerticalIcon style={{ width: '20px', height: '20px' }} />
                                </button>
                                {openDropdownId.value === avatar._id && (
                                  <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '160px', right: '0', top: '100%', zIndex: 1000 }}>
                                    {avatar.isActive && (
                                      <>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                          onClick={() => { openViewModal(avatar); openDropdownId.value = null; }}
                                        >
                                          <EyeIcon style={{ width: '18px', height: '18px' }} />
                                          <span>View Details</span>
                                        </button>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                          onClick={() => { editAvatar(avatar); openDropdownId.value = null; }}
                                        >
                                          <PencilIcon style={{ width: '18px', height: '18px' }} />
                                          <span>Edit</span>
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                      onClick={() => toggleAvatarStatus(avatar)}
                                    >
                                      {avatar.isActive ? (
                                        <XCircleIcon style={{ width: '18px', height: '18px' }} class="text-danger" />
                                      ) : (
                                        <CheckCircleIcon style={{ width: '18px', height: '18px' }} class="text-success" />
                                      )}
                                      <span>{avatar.isActive ? 'Disable' : 'Enable'}</span>
                                    </button>
                                    {avatar.isActive && (
                                      <>
                                        <div class="dropdown-divider"></div>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger"
                                          onClick={() => { deleteAvatar(avatar._id); openDropdownId.value = null; }}
                                        >
                                          <TrashIcon style={{ width: '18px', height: '18px' }} />
                                          <span>Delete</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <p class="text-muted small mb-3 lh-base" style={{ fontSize: '0.85rem' }}>
                              {avatar.description.length > 80 ? avatar.description.substring(0, 80) + '...' : avatar.description}
                            </p>
                            
                            {/* Category and Gender Info */}
                            <div class="d-flex flex-wrap gap-1 mb-2">
                              <span class={`badge ${
                                avatar.category === 'Deity' ? 'bg-primary' :
                                avatar.category === 'Rashami' ? 'bg-success' :
                                avatar.category === 'Expert' ? 'bg-warning text-dark' : 'bg-secondary'
                              } px-2 py-1`} style={{ fontSize: '0.75rem' }}>
                                {avatar.category === 'Deity' ? '🕉️ Deity' :
                                 avatar.category === 'Rashami' ? '🌟 Rashami' :
                                 avatar.category === 'Expert' ? '👨🏫 Expert' : avatar.category}
                              </span>
                              <span class="badge bg-light text-dark px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                {avatar.gender === 'Male' ? '👨 Male' : '👩 Female'}
                              </span>
                            </div>
                            
                            {/* Content Badges */}
                            <div class="d-flex flex-wrap gap-1 mb-3">
                              {avatar.videoUrl && (
                                <span 
                                  class={`badge bg-success d-flex align-items-center gap-1 ${avatar.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: avatar.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(avatar, 'video')}
                                  title={avatar.isActive ? "Click to view video" : "Content disabled"}
                                >
                                  <PlayIcon style={{ width: '14px', height: '14px' }} />
                                  Video
                                </span>
                              )}
                              {avatar.imageUrl && (
                                <span 
                                  class={`badge bg-info d-flex align-items-center gap-1 cursor-pointer`}
                                  style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => {
                                    mediaContent.value = { type: 'image', url: avatar.imageUrl };
                                    showMediaModal.value = true;
                                  }}
                                  title="Click to view image"
                                >
                                  <UserIcon style={{ width: '14px', height: '14px' }} />
                                  Image
                                </span>
                              )}
                              {avatar.link && (
                                <span 
                                  class={`badge bg-warning d-flex align-items-center gap-1 ${avatar.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: avatar.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(avatar, 'link')}
                                  title={avatar.isActive ? "Click to open link" : "Content disabled"}
                                >
                                  Link
                                </span>
                              )}
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                              <small class="text-muted">
                                {new Date(avatar.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </small>
                              {!avatar.isActive && (
                                <span class="badge bg-secondary small">Disabled</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div class="text-center py-5">
                    <div class="mb-4 p-4 rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                      <VideoCameraIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                    </div>
                    <h4 class="text-muted mb-3">🎭 No avatars yet</h4>
                    <p class="text-muted mb-4">Create your first interactive live avatar experience</p>
                    <button 
                      class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
                      onClick={() => showAddModal.value = true}
                      style={{ fontWeight: '600' }}
                    >
                      <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} class="me-2" />
                      Create First Avatar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Details Modal */}
            {showViewModal.value && selectedAvatar.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeViewModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        {selectedAvatar.value.name}
                      </h5>
                      <button type="button" class="btn-close" onClick={closeViewModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Agent ID</h6>
                        <p class="mb-0">{selectedAvatar.value.agentId}</p>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Category</h6>
                        <span class={`badge ${
                          selectedAvatar.value.category === 'Deity' ? 'bg-primary' :
                          selectedAvatar.value.category === 'Rashami' ? 'bg-success' :
                          selectedAvatar.value.category === 'Expert' ? 'bg-warning text-dark' : 'bg-secondary'
                        } px-3 py-2`}>
                          {selectedAvatar.value.category === 'Deity' ? '🕉️ Deity' :
                           selectedAvatar.value.category === 'Rashami' ? '🌟 Rashami' :
                           selectedAvatar.value.category === 'Expert' ? '👨‍🏫 Expert' : selectedAvatar.value.category}
                        </span>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Gender</h6>
                        <p class="mb-0">{selectedAvatar.value.gender === 'Male' ? '👨 Male' : '👩 Female'}</p>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Description</h6>
                        <p class="mb-0 lh-base">{selectedAvatar.value.description}</p>
                      </div>
                      
                      {selectedAvatar.value.link && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted">External Link</h6>
                          <a href={selectedAvatar.value.link} target="_blank" class="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" style={{ width: 'fit-content' }}>
                            <UserIcon style={{ width: '18px', height: '18px' }} />
                            Open Link
                          </a>
                        </div>
                      )}
                      
                      {selectedAvatar.value.videoUrl && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <PlayIcon style={{ width: '16px', height: '16px' }} />
                            Video
                          </h6>
                          <video controls class="w-100 rounded-3" style={{ maxHeight: '250px' }}>
                            <source src={selectedAvatar.value.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      
                      {selectedAvatar.value.imageUrl && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <UserIcon style={{ width: '16px', height: '16px' }} />
                            Image
                          </h6>
                          <img 
                            src={selectedAvatar.value.imageUrl} 
                            alt={selectedAvatar.value.name} 
                            class="img-fluid rounded-3" 
                            style={{ maxHeight: '300px', width: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted">Created</h6>
                          <p class="mb-0">{new Date(selectedAvatar.value.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                        <div class="col-md-6 mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted">Last Updated</h6>
                          <p class="mb-0">{new Date(selectedAvatar.value.updatedAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</p>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={closeViewModal}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Preview Modal */}
            {showMediaModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={closeMediaModal}>
                <div class="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        {mediaContent.value.type === 'video' ? (
                          <PlayIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        ) : (
                          <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        )}
                        {mediaContent.value.type === 'video' ? 'Video Preview' : 'Image Preview'}
                      </h5>
                      <button type="button" class="btn-close" onClick={closeMediaModal}></button>
                    </div>
                    <div class="modal-body p-0">
                      {mediaContent.value.type === 'video' ? (
                        <video controls class="w-100" style={{ maxHeight: '70vh', borderRadius: '0 0 16px 16px' }}>
                          <source src={mediaContent.value.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img 
                          src={mediaContent.value.url} 
                          alt="Preview" 
                          class="w-100" 
                          style={{ 
                            maxHeight: '70vh', 
                            objectFit: 'contain',
                            borderRadius: '0 0 16px 16px'
                          }} 
                        />
                      )}
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={closeMediaModal}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showAddModal.value = false}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PlusIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        Upload New Avatar
                      </h5>
                      <button type="button" class="btn-close" onClick={() => showAddModal.value = false}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="avatar-name">Name *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            id="avatar-name"
                            name="avatarName"
                            v-model={newAvatar.value.name}
                            placeholder="Enter avatar name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="agent-id">Agent ID *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            id="agent-id"
                            name="agentId"
                            v-model={newAvatar.value.agentId}
                            placeholder="Enter agent ID"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="avatar-description">Description *</label>
                          <textarea 
                            class="form-control rounded-3" 
                            rows="3"
                            id="avatar-description"
                            name="avatarDescription"
                            v-model={newAvatar.value.description}
                            placeholder="Enter avatar description"
                            required
                          ></textarea>
                        </div>
                        
                        <div class="row">
                          <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold small" for="avatar-gender">Gender *</label>
                            <select class="form-select rounded-3" id="avatar-gender" name="avatarGender" v-model={newAvatar.value.gender} required>
                              <option value="Male">👨 Male</option>
                              <option value="Female">👩 Female</option>
                            </select>
                          </div>
                          <div class="col-md-6 mb-3">
                            <label class="form-label fw-semibold small" for="avatar-category">Category *</label>
                            <select class="form-select rounded-3" id="avatar-category" name="avatarCategory" v-model={newAvatar.value.category} required>
                              <option value="Deity">🕉️ Deity</option>
                              <option value="Rashami">🌟 Rashami</option>
                              <option value="Expert">👨‍🏫 Expert</option>
                            </select>
                          </div>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="avatar-link">Link (Optional)</label>
                          <input 
                            type="url" 
                            class="form-control rounded-3" 
                            id="avatar-link"
                            name="avatarLink"
                            v-model={newAvatar.value.link}
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="avatar-videos">Upload Video</label>
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            id="avatar-videos"
                            name="avatarVideos"

                            accept="video/*"
                            onChange={handleVideoUpload}
                          />
                          {videoUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success">
                                ✓ Video uploaded: {videoFileName.value}
                              </small>
                            </div>
                          )}
                          {loading.value && uploadProgress.value.video > 0 && (
                            <div class="mt-2">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-primary">Uploading video...</small>
                                <small class="text-primary fw-bold">{uploadProgress.value.video}%</small>
                              </div>
                              <div class="progress" style={{ height: '6px' }}>
                                <div 
                                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                  style={{ width: `${uploadProgress.value.video}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          <small class="text-muted">Max 50MB (~5 min HD video)</small>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="avatar-image">Upload Image</label>
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            id="avatar-image"
                            name="avatarImage"
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                          {imageUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success">
                                ✓ Image uploaded: {imageFileName.value}
                              </small>
                            </div>
                          )}
                          {loading.value && uploadProgress.value.image > 0 && (
                            <div class="mt-2">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-primary">Uploading image...</small>
                                <small class="text-primary fw-bold">{uploadProgress.value.image}%</small>
                              </div>
                              <div class="progress" style={{ height: '6px' }}>
                                <div 
                                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                  style={{ width: `${uploadProgress.value.image}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm me-2" onClick={() => showAddModal.value = false}>
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-3 btn-sm" 
                        onClick={addAvatar}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Uploading...' : 'Upload'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal.value && editingAvatar.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showEditModal.value = false}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PencilIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        Edit Avatar
                      </h5>
                      <button type="button" class="btn-close" onClick={() => showEditModal.value = false}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="edit-avatar-name">Name *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            id="edit-avatar-name"
                            name="editAvatarName"
                            v-model={editingAvatar.value.name}
                            placeholder="Enter avatar name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="edit-agent-id">Agent ID *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            id="edit-agent-id"
                            name="editAgentId"
                            v-model={editingAvatar.value.agentId}
                            placeholder="Enter agent ID"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="edit-avatar-description">Description *</label>
                          <textarea 
                            class="form-control rounded-3" 
                            rows="3"
                            id="edit-avatar-description"
                            name="editAvatarDescription"
                            v-model={editingAvatar.value.description}
                            placeholder="Enter avatar description"
                            required
                          ></textarea>
                        </div>
                        
                        <div class="row">
                          <div class="col-md-4 mb-3">
                            <label class="form-label fw-semibold small" for="edit-avatar-gender">Gender *</label>
                            <select class="form-select rounded-3" id="edit-avatar-gender" name="editAvatarGender" v-model={editingAvatar.value.gender} required>
                              <option value="Male">👨 Male</option>
                              <option value="Female">👩 Female</option>
                            </select>
                          </div>
                          <div class="col-md-4 mb-3">
                            <label class="form-label fw-semibold small" for="edit-avatar-category">Category *</label>
                            <select class="form-select rounded-3" id="edit-avatar-category" name="editAvatarCategory" v-model={editingAvatar.value.category} required>
                              <option value="Deity">Deity</option>
                              <option value="Rashami">Rashami</option>
                              <option value="Expert">Expert</option>
                            </select>
                          </div>
                          <div class="col-md-4 mb-3">
                            <label class="form-label fw-semibold small" for="edit-avatar-link">Link (Optional)</label>
                            <input 
                              type="url" 
                              class="form-control rounded-3" 
                              id="edit-avatar-link"
                              name="editAvatarLink"
                              v-model={editingAvatar.value.link}
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="edit-avatar-videos">Upload New Video (Optional)</label>
                          {editingAvatar.value.videoUrl && !editVideoUploaded.value && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">📹 Current video preview:</small>
                              <video 
                                controls 
                                class="w-100 rounded-3" 
                                style={{ maxHeight: '150px', cursor: 'pointer' }}
                                onClick={() => viewContent({ videoUrl: editingAvatar.value.videoUrl, isActive: true }, 'video')}
                              >
                                <source src={editingAvatar.value.videoUrl} type="video/mp4" />
                              </video>
                              <small class="text-muted d-block mt-1">Click to open in new tab</small>
                            </div>
                          )}
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            id="edit-avatar-videos"
                            name="editAvatarVideos"
                            accept="video/*"
                            onChange={handleEditVideoUpload}
                          />
                          {editVideoUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success">
                                ✓ Video uploaded: {editVideoFileName.value}
                              </small>
                            </div>
                          )}
                          {loading.value && editUploadProgress.value.video > 0 && (
                            <div class="mt-2">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-primary">Uploading video...</small>
                                <small class="text-primary fw-bold">{editUploadProgress.value.video}%</small>
                              </div>
                              <div class="progress" style={{ height: '6px' }}>
                                <div 
                                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                  style={{ width: `${editUploadProgress.value.video}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          {editingAvatar.value.videoUrl && !editVideoUploaded.value && (
                            <small class="text-info d-block mt-1">Current video will be kept if no new video is uploaded</small>
                          )}
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small" for="edit-avatar-image">Upload New Image (Optional)</label>
                          {editingAvatar.value.imageUrl && !editImageUploaded.value && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">🖼️ Current image preview:</small>
                              <img 
                                src={editingAvatar.value.imageUrl} 
                                alt="Current" 
                                class="img-fluid rounded-3" 
                                style={{ maxHeight: '150px', cursor: 'pointer' }}
                                onClick={() => viewContent({ imageUrl: editingAvatar.value.imageUrl, isActive: true }, 'image')}
                              />
                              <small class="text-muted d-block mt-1">Click to open in new tab</small>
                            </div>
                          )}
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            id="edit-avatar-image"
                            name="editAvatarImage"
                            accept="image/*"
                            onChange={handleEditImageUpload}
                          />
                          {editImageUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success">
                                ✓ Image uploaded: {editImageFileName.value}
                              </small>
                            </div>
                          )}
                          {loading.value && editUploadProgress.value.image > 0 && (
                            <div class="mt-2">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-primary">Uploading image...</small>
                                <small class="text-primary fw-bold">{editUploadProgress.value.image}%</small>
                              </div>
                              <div class="progress" style={{ height: '6px' }}>
                                <div 
                                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                  style={{ width: `${editUploadProgress.value.image}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          {editingAvatar.value.imageUrl && !editImageUploaded.value && (
                            <small class="text-info d-block mt-1">Current image will be kept if no new image is uploaded</small>
                          )}
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm me-2" onClick={() => showEditModal.value = false}>
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-3 btn-sm" 
                        onClick={updateAvatar}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Updating...' : 'Update'}
                      </button>
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