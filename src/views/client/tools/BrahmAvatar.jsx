import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  FilmIcon, 
  TrashIcon, 
  PencilIcon, 
  PlayIcon, 
  EyeIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/vue/24/outline';
import { brahmAvatarService } from '../../../services/brahmAvatarService';
import { useToast } from 'vue-toastification';

export default {
  name: 'ClientBrahmAvatar',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const reels = ref([]);
    
    const loading = ref(false);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const showMediaModal = ref(false);
    const selectedReel = ref(null);
    const mediaContent = ref({ type: '', url: '' });
    const openDropdownId = ref(null);
    const editingReel = ref(null);
    const uploadProgress = ref({ video: 0, thumbnail: 0 });
    const videoUploaded = ref(false);
    const videoFileName = ref('');
    const thumbnailUploaded = ref(false);
    const thumbnailFileName = ref('');

    const newReel = ref({
      name: '',
      description: '',
      category: 'Spiritual',
      type: 'Reel',
      video: null,
      image: null,
      imagePrompt: '',
      videoPrompt: ''
    });

    // Helper function to decode HTML entities in URLs and add CORS bypass
    const decodeUrl = (url) => {
      if (!url) return url;
      let decodedUrl = url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x3D;/g, '=');
      
      console.log('🔧 URL Decode:', { original: url, decoded: decodedUrl });
      return decodedUrl;
    };

    const loadReels = async () => {
      try {
        loading.value = true;
        const response = await brahmAvatarService.getBrahmAvatars(true);
        console.log('🔍 API Response:', response.data);
        
        // Handle nested data structure: response.data.data.data
        const reelsData = response.data?.data?.data || response.data?.data || [];
        reels.value = Array.isArray(reelsData) ? reelsData : [];
        
        console.log('📦 Reels loaded:', reels.value.length);
        console.log('🎬 First reel:', reels.value[0]);
        
        // Clean and decode URLs, remove duplicates
        if (Array.isArray(reels.value)) {
          reels.value.forEach((reel, index) => {
            // Use videoUrl as primary, fallback to video
            const videoSource = reel.videoUrl || reel.video;
            if (videoSource) {
              reel.videoUrl = decodeUrl(videoSource);
              delete reel.video; // Remove duplicate
            }
            
            // Use imageUrl as primary, fallback to image
            const imageSource = reel.imageUrl || reel.image;
            if (imageSource) {
              reel.imageUrl = decodeUrl(imageSource);
              delete reel.image; // Remove duplicate
            }
            
            console.log(`Reel ${index + 1} (${reel.name}):`);
            console.log('  - videoUrl:', reel.videoUrl);
            console.log('  - imageUrl:', reel.imageUrl);
          });
        }
      } catch (error) {
        console.error('❌ Error loading reels:', error);
        toast.error('Error loading reels');
        reels.value = []; // Ensure it's always an array
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push('/client/tools');
    };

    const toggleDropdown = (reelId) => {
      openDropdownId.value = openDropdownId.value === reelId ? null : reelId;
    };

    const viewReel = (reel) => {
      selectedReel.value = reel;
      showViewModal.value = true;
    };

    const editReel = (reel) => {
      console.log('🔧 Edit reel called with:', reel);
      console.log('🎥 Video URL:', reel.videoUrl);
      console.log('🖼️ Image URL:', reel.imageUrl);
      
      // Clean URLs for editing
      const reelCopy = { ...reel };
      if (reelCopy.videoUrl) {
        reelCopy.videoUrl = decodeUrl(reelCopy.videoUrl);
      }
      if (reelCopy.imageUrl) {
        reelCopy.imageUrl = decodeUrl(reelCopy.imageUrl);
      }
      
      editingReel.value = reelCopy;
      console.log('📝 Editing reel set to:', editingReel.value);
      showEditModal.value = true;
      openDropdownId.value = null;
    };

    const deleteReel = async (reelId) => {
      if (!confirm('Are you sure you want to delete this reel?')) return;
      
      try {
        loading.value = true;
        await brahmAvatarService.deleteBrahmAvatar(reelId);
        
        // Remove from local array immediately
        reels.value = reels.value.filter(r => r._id !== reelId);
        
        toast.success('✓ Reel deleted successfully!');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('❌ Failed to delete reel');
      } finally {
        loading.value = false;
      }
    };

    const viewContent = (reel, type) => {
      if (type === 'video' && reel.videoUrl) {
        mediaContent.value = { type: 'video', url: reel.videoUrl };
        showMediaModal.value = true;
        incrementViews(reel._id);
      } else if (type === 'image' && reel.imageUrl) {
        mediaContent.value = { type: 'image', url: reel.imageUrl };
        showMediaModal.value = true;
        incrementViews(reel._id);
      }
    };

    const closeMediaModal = () => {
      showMediaModal.value = false;
      mediaContent.value = { type: '', url: '' };
    };

    const closeViewModal = () => {
      showViewModal.value = false;
      selectedReel.value = null;
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      editingReel.value = null;
    };

    const updateReel = async () => {
      try {
        loading.value = true;
        uploadProgress.value = { video: 0, thumbnail: 0 };
        
        const updateData = {
          name: editingReel.value.name,
          description: editingReel.value.description,
          category: editingReel.value.category,
          type: editingReel.value.type,
          imagePrompt: editingReel.value.imagePrompt,
          videoPrompt: editingReel.value.videoPrompt
        };
        
        // Upload new video if selected
        if (editingReel.value.newVideo) {
          try {
            toast.info('Uploading new video...');
            const response = await brahmAvatarService.getUploadUrl({
              fileName: editingReel.value.newVideo.name,
              contentType: editingReel.value.newVideo.type,
              fileType: 'video'
            });
            
            const { uploadUrl, fileUrl } = response.data.data;
            
            await brahmAvatarService.uploadToS3(
              uploadUrl,
              editingReel.value.newVideo,
              (progress) => {
                uploadProgress.value.video = Math.round(progress);
              }
            );
            
            updateData.videoUrl = fileUrl;
          } catch (error) {
            console.error('Video upload failed:', error);
            toast.error('❌ Video upload failed');
            return;
          }
        }
        
        // Upload new image if selected
        if (editingReel.value.newImage) {
          try {
            toast.info('Uploading new image...');
            const response = await brahmAvatarService.getUploadUrl({
              fileName: editingReel.value.newImage.name,
              contentType: editingReel.value.newImage.type,
              fileType: 'image'
            });
            
            const { uploadUrl, fileUrl } = response.data.data;
            
            await brahmAvatarService.uploadToS3(
              uploadUrl,
              editingReel.value.newImage,
              (progress) => {
                uploadProgress.value.thumbnail = Math.round(progress);
              }
            );
            
            updateData.imageUrl = fileUrl;
          } catch (error) {
            console.error('Image upload failed:', error);
            toast.error('❌ Image upload failed');
            return;
          }
        }
        
        const response = await brahmAvatarService.updateBrahmAvatar(editingReel.value._id, updateData);
        
        console.log('🔄 Update API Response:', response);
        console.log('🔄 Response data:', response.data);
        
        // Update local state immediately with the response data
        const reelIndex = reels.value.findIndex(r => r._id === editingReel.value._id);
        if (reelIndex !== -1 && response.data && response.data.data) {
          const updatedReel = {
            ...response.data.data,
            videoUrl: response.data.data.videoUrl ? decodeUrl(response.data.data.videoUrl) : editingReel.value.videoUrl,
            imageUrl: response.data.data.imageUrl ? decodeUrl(response.data.data.imageUrl) : editingReel.value.imageUrl,
            video: response.data.data.video ? decodeUrl(response.data.data.video) : editingReel.value.video,
            image: response.data.data.image ? decodeUrl(response.data.data.image) : editingReel.value.image,
            videoKey: response.data.data.videoKey || editingReel.value.videoKey,
            imageKey: response.data.data.imageKey || editingReel.value.imageKey
          };
          
          // Update the reel in the array
          reels.value[reelIndex] = updatedReel;
          
          console.log('✅ Local state updated with:', updatedReel);
        }
        
        // Reset progress and close modal
        uploadProgress.value = { video: 0, thumbnail: 0 };
        closeEditModal();
        
        toast.success('✓ Reel updated successfully!');
      } catch (error) {
        console.error('Update error:', error);
        toast.error('❌ Failed to update reel');
      } finally {
        loading.value = false;
      }
    };

    const toggleReelStatus = async (reel) => {
      try {
        const response = await brahmAvatarService.toggleBrahmAvatar(reel._id);
        openDropdownId.value = null;
        
        // Update local state immediately
        const reelIndex = reels.value.findIndex(r => r._id === reel._id);
        if (reelIndex !== -1 && response.data && response.data.data) {
          reels.value[reelIndex].isActive = response.data.data.isActive;
        }
        
        toast.success(`✓ Reel ${response.data.data.isActive ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('Toggle status error:', error);
        toast.error('❌ Failed to toggle reel status');
      }
    };

    // Increment views when content is viewed
    const incrementViews = async (reelId) => {
      try {
        await brahmAvatarService.incrementViews(reelId);
        // Update local state
        const reelIndex = reels.value.findIndex(r => r._id === reelId);
        if (reelIndex !== -1) {
          reels.value[reelIndex].views = (reels.value[reelIndex].views || 0) + 1;
        }
      } catch (error) {
        console.error('Error incrementing views:', error);
      }
    };

    // Toggle like status
    const toggleLike = async (reelId) => {
      try {
        const response = await brahmAvatarService.toggleLike(reelId);
        // Update local state
        const reelIndex = reels.value.findIndex(r => r._id === reelId);
        if (reelIndex !== -1 && response.data) {
          reels.value[reelIndex].likes = response.data.likes || 0;
          reels.value[reelIndex].isLiked = response.data.isLiked || false;
        }
        toast.success(response.data.isLiked ? '❤️ Liked!' : '💔 Unliked!');
      } catch (error) {
        console.error('Error toggling like:', error);
        toast.error('❌ Failed to update like');
      }
    };

    // Increment shares
    const incrementShares = async (reelId) => {
      try {
        await brahmAvatarService.incrementShares(reelId);
        // Update local state
        const reelIndex = reels.value.findIndex(r => r._id === reelId);
        if (reelIndex !== -1) {
          reels.value[reelIndex].shares = (reels.value[reelIndex].shares || 0) + 1;
        }
        toast.success('📤 Shared!');
      } catch (error) {
        console.error('Error incrementing shares:', error);
      }
    };

    const handleVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newReel.value.video = file;
        videoUploaded.value = true;
        videoFileName.value = file.name;
      }
    };

    const handleThumbnailUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newReel.value.image = file;
        thumbnailUploaded.value = true;
        thumbnailFileName.value = file.name;
      }
    };

    const addReel = async () => {
      try {
        loading.value = true;
        toast.info('Creating reel...');
        
        let videoUrl = null;
        let imageUrl = null;
        
        // Upload video file if selected
        if (newReel.value.video) {
          try {
            toast.info('Uploading video...');
            const response = await brahmAvatarService.getUploadUrl({
              fileName: newReel.value.video.name,
              contentType: newReel.value.video.type,
              fileType: 'video'
            });
            
            const { uploadUrl, fileUrl } = response.data.data;
            
            await brahmAvatarService.uploadToS3(
              uploadUrl,
              newReel.value.video,
              (progress) => {
                uploadProgress.value.video = Math.round(progress);
              }
            );
            
            videoUrl = fileUrl;
          } catch (error) {
            console.error('Video upload failed:', error);
            toast.error('❌ Video upload failed');
            return;
          }
        }
        
        // Upload image file if selected
        if (newReel.value.image) {
          try {
            toast.info('Uploading image...');
            const response = await brahmAvatarService.getUploadUrl({
              fileName: newReel.value.image.name,
              contentType: newReel.value.image.type,
              fileType: 'image'
            });
            
            const { uploadUrl, fileUrl } = response.data.data;
            
            await brahmAvatarService.uploadToS3(
              uploadUrl,
              newReel.value.image,
              (progress) => {
                uploadProgress.value.thumbnail = Math.round(progress);
              }
            );
            
            imageUrl = fileUrl;
          } catch (error) {
            console.error('Image upload failed:', error);
            toast.error('❌ Image upload failed');
            return;
          }
        }
        
        // Create reel with uploaded file URLs
        const reelData = {
          name: newReel.value.name,
          description: newReel.value.description,
          category: newReel.value.category,
          type: newReel.value.type,
          imagePrompt: newReel.value.imagePrompt,
          videoPrompt: newReel.value.videoPrompt,
          videoUrl: videoUrl,
          imageUrl: imageUrl
        };
        
        const response = await brahmAvatarService.createBrahmAvatar(reelData);
        
        // Add the new reel to the beginning of the array using API response
        if (response.data && response.data.data) {
          reels.value.unshift(response.data.data);
        }
        
        // Reset form
        newReel.value = {
          name: '',
          description: '',
          category: 'Spiritual',
          type: 'Reel',
          video: null,
          image: null,
          imagePrompt: '',
          videoPrompt: ''
        };
        videoUploaded.value = false;
        videoFileName.value = '';
        thumbnailUploaded.value = false;
        thumbnailFileName.value = '';
        showAddModal.value = false;
        
        toast.success('✓ Reel created successfully!');
      } catch (error) {
        console.error('Error creating reel:', error);
        toast.error('❌ Failed to create reel');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      loadReels();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
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
                  <h1 class="mb-1 fw-bold fs-2 text-dark">🎬 Brahm Avatar (Reels)</h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>Create and manage spiritual reels and short video content</p>
                  {reels.value.length > 0 && (
                    <small class="text-dark d-block mt-1" style={{ opacity: 0.8 }}>
                      <FilmIcon style={{ width: '16px', height: '16px' }} class="me-1" />
                      {reels.value.length} total reels • {reels.value.filter(r => r.isActive).length} active
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
                  <span class="d-none d-sm-inline">Create Reel</span>
                  <span class="d-sm-none">Create</span>
                </button>
              </div>
            </div>

            {/* Reels List */}
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-3 p-md-4">
                <h5 class="fw-bold mb-3">Spiritual Reels</h5>
                {loading.value ? (
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : reels.value.length > 0 ? (
                  <div class="row g-3">
                    {reels.value.map(reel => (
                      <div key={reel._id} class="col-12 col-md-6 col-lg-4">
                        <div class={`card h-100 border-0 shadow-sm position-relative ${!reel.isActive ? 'opacity-50' : ''}`} style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
                          {!reel.isActive && (
                            <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, borderRadius: '16px', cursor: 'default' }}>
                              <span class="badge bg-secondary px-3 py-2 rounded-pill shadow d-flex align-items-center gap-2">
                                <XCircleIcon style={{ width: '16px', height: '16px' }} />
                                Disabled
                              </span>
                            </div>
                          )}
                          
                          {/* Card Media */}
                          {(reel.videoUrl || reel.video || reel.imageUrl || reel.image) && (
                            <div class="position-relative" style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                              {(reel.videoUrl || reel.video) ? (
                                // Video thumbnail with play button
                                <>
                                  <video 
                                    class="w-100 h-100"
                                    style={{ objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => viewContent(reel, 'video')}
                                    crossorigin="anonymous"
                                    muted
                                    onError={(e) => {
                                      console.error('Main card video load error:', e);
                                      console.log('Video URL:', reel.videoUrl || reel.video);
                                      console.log('Full reel object:', reel);
                                    }}
                                  >
                                    <source src={reel.videoUrl || reel.video} type="video/mp4" />
                                  </video>
                                  <div class="position-absolute top-50 start-50 translate-middle">
                                    <button 
                                      class="btn btn-primary rounded-circle"
                                      style={{ width: '60px', height: '60px', cursor: 'pointer' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewContent(reel, 'video');
                                      }}
                                    >
                                      <PlayIcon style={{ width: '24px', height: '24px' }} />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                // Image only
                                <img 
                                  src={reel.imageUrl || reel.image} 
                                  alt={reel.name}
                                  class="w-100 h-100"
                                  style={{ objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => viewContent(reel, 'image')}
                                  crossorigin="anonymous"
                                  onError={(e) => {
                                    console.error('Main card image load error:', e);
                                    console.log('Image URL:', reel.imageUrl || reel.image);
                                    console.log('Full reel object:', reel);
                                  }}
                                />
                              )}
                            </div>
                          )}
                          
                          <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="fw-bold mb-0 text-truncate" style={{ fontSize: '1rem' }}>{reel.name}</h6>
                              <div class="dropdown position-relative">
                                <button 
                                  class="btn btn-dark rounded-circle p-2 d-flex align-items-center justify-content-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleDropdown(reel._id);
                                  }}
                                  style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    border: 'none',
                                    zIndex: 20,
                                    position: 'relative'
                                  }}
                                >
                                  <EllipsisVerticalIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                                </button>
                                {openDropdownId.value === reel._id && (
                                  <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '150px', right: '0', left: 'auto', top: '100%', zIndex: 1050 }} onClick={(e) => e.stopPropagation()}>
                                    {reel.isActive ? (
                                      // Active reel - show all options
                                      <>
                                        <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => { viewReel(reel); openDropdownId.value = null; }}>
                                          <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                                          <span>View</span>
                                        </button>
                                        <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => { editReel(reel); openDropdownId.value = null; }}>
                                          <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                                          <span>Edit</span>
                                        </button>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                          onClick={() => toggleReelStatus(reel)}
                                        >
                                          <span>🔴</span>
                                          <span>Disable</span>
                                        </button>
                                        <hr class="dropdown-divider my-1" />
                                        <button class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={() => { deleteReel(reel._id); openDropdownId.value = null; }}>
                                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                          <span>Delete</span>
                                        </button>
                                      </>
                                    ) : (
                                      // Disabled reel - show only enable option
                                      <button 
                                        class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                        onClick={() => toggleReelStatus(reel)}
                                      >
                                        <span>🟢</span>
                                        <span>Enable</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <p class="text-muted small mb-3 lh-base" style={{ fontSize: '0.85rem' }}>
                              {reel.description.length > 80 ? reel.description.substring(0, 80) + '...' : reel.description}
                            </p>
                            
                            {/* Content Badges */}
                            <div class="d-flex flex-wrap gap-1 mb-3">
                              {(reel.videoUrl || reel.video) && (
                                <span 
                                  class={`badge bg-success d-flex align-items-center gap-1`}
                                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                                  onClick={() => viewContent(reel, 'video')}
                                  title="Click to view video"
                                >
                                  <PlayIcon style={{ width: '14px', height: '14px' }} />
                                  Video
                                </span>
                              )}
                              {(reel.imageUrl || reel.image) && (
                                <span 
                                  class={`badge bg-info d-flex align-items-center gap-1`}
                                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
                                  onClick={() => viewContent(reel, 'image')}
                                  title="Click to view image"
                                >
                                  <FilmIcon style={{ width: '14px', height: '14px' }} />
                                  Image
                                </span>
                              )}
                              <span class="badge bg-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                {reel.category}
                              </span>
                              <span class="badge bg-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                {reel.type}
                              </span>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                              <small class="text-muted">
                                {new Date(reel.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </small>
                              {!reel.isActive && (
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
                      <FilmIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                    </div>
                    <h4 class="text-muted mb-3">🎬 No reels yet</h4>
                    <p class="text-muted mb-4">Create your first spiritual reel to engage your audience</p>
                    <button 
                      class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
                      onClick={() => showAddModal.value = true}
                      style={{ fontWeight: '600' }}
                    >
                      <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} class="me-2" />
                      Create First Reel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Add Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showAddModal.value = false}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PlusIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        Create New Reel
                      </h5>
                      <button type="button" class="btn-close" onClick={() => showAddModal.value = false}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label for="reel-name" class="form-label fw-semibold small">Name *</label>
                          <input 
                            id="reel-name"
                            name="name"
                            type="text" 
                            class="form-control rounded-3" 
                            v-model={newReel.value.name}
                            placeholder="Enter reel name"
                            autocomplete="off"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label for="reel-description" class="form-label fw-semibold small">Description *</label>
                          <textarea 
                            id="reel-description"
                            name="description"
                            class="form-control rounded-3" 
                            rows="3"
                            v-model={newReel.value.description}
                            placeholder="Enter reel description"
                            required
                          ></textarea>
                        </div>
                        
                        <div class="row">
                          <div class="col-md-6 mb-3">
                            <label for="reel-category" class="form-label fw-semibold small">Category *</label>
                            <select 
                              id="reel-category"
                              name="category"
                              class="form-select rounded-3" 
                              v-model={newReel.value.category} 
                              required
                            >
                              <option value="Spiritual">🕉️ Spiritual</option>
                              <option value="Devotional">🙏 Devotional</option>
                              <option value="Meditation">🧘 Meditation</option>
                              <option value="Mantra">📿 Mantra</option>
                              <option value="Festival">🎉 Festival</option>
                            </select>
                          </div>
                          <div class="col-md-6 mb-3">
                            <label for="reel-type" class="form-label fw-semibold small">Type *</label>
                            <select 
                              id="reel-type"
                              name="type"
                              class="form-select rounded-3" 
                              v-model={newReel.value.type} 
                              required
                            >
                              <option value="Reel">📱 Reel</option>
                              <option value="Short">⚡ Short</option>
                              <option value="Story">📖 Story</option>
                            </select>
                          </div>
                        </div>
                        
                        <div class="mb-3">
                          <label for="reel-video" class="form-label fw-semibold small">Upload Video *</label>
                          <input 
                            id="reel-video"
                            name="video"
                            type="file" 
                            class="form-control rounded-3" 
                            accept="video/*"
                            onChange={handleVideoUpload}
                            required
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
                          <small class="text-muted">Max 200MB (~5 min HD video)</small>
                        </div>
                        
                        <div class="mb-3">
                          <label for="reel-image" class="form-label fw-semibold small">Upload Image *</label>
                          <input 
                            id="reel-image"
                            name="image"
                            type="file" 
                            class="form-control rounded-3" 
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                            required
                          />
                          {thumbnailUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success">
                                ✓ Image uploaded: {thumbnailFileName.value}
                              </small>
                            </div>
                          )}
                          {loading.value && uploadProgress.value.thumbnail > 0 && (
                            <div class="mt-2">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-primary">Uploading image...</small>
                                <small class="text-primary fw-bold">{uploadProgress.value.thumbnail}%</small>
                              </div>
                              <div class="progress" style={{ height: '6px' }}>
                                <div 
                                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                  style={{ width: `${uploadProgress.value.thumbnail}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div class="mb-3">
                          <label for="reel-image-prompt" class="form-label fw-semibold small">Image Prompt *</label>
                          <textarea 
                            id="reel-image-prompt"
                            name="imagePrompt"
                            class="form-control rounded-3" 
                            rows="2"
                            v-model={newReel.value.imagePrompt}
                            placeholder="Describe the image you want to generate"
                            required
                          ></textarea>
                        </div>
                        
                        <div class="mb-3">
                          <label for="reel-video-prompt" class="form-label fw-semibold small">Video Prompt *</label>
                          <textarea 
                            id="reel-video-prompt"
                            name="videoPrompt"
                            class="form-control rounded-3" 
                            rows="2"
                            v-model={newReel.value.videoPrompt}
                            placeholder="Describe the video you want to generate"
                            required
                          ></textarea>
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
                        onClick={addReel}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Creating...' : 'Create Reel'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* View Modal */}
            {showViewModal.value && selectedReel.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeViewModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        {selectedReel.value.name}
                      </h5>
                      <button type="button" class="btn-close" onClick={closeViewModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      {/* Basic Info */}
                      <div class="row mb-4">
                        <div class="col-md-6">
                          <div class="card bg-light border-0 h-100">
                            <div class="card-body p-3">
                              <h6 class="fw-bold text-primary mb-2">📝 Basic Information</h6>
                              <div class="mb-2">
                                <small class="text-muted fw-semibold">Name:</small>
                                <p class="mb-1">{selectedReel.value.name}</p>
                              </div>
                              <div class="mb-2">
                                <small class="text-muted fw-semibold">Description:</small>
                                <p class="mb-1">{selectedReel.value.description}</p>
                              </div>
                              <div class="row">
                                <div class="col-6">
                                  <small class="text-muted fw-semibold">Category:</small>
                                  <p class="mb-0">
                                    <span class="badge bg-primary">{selectedReel.value.category}</span>
                                  </p>
                                </div>
                                <div class="col-6">
                                  <small class="text-muted fw-semibold">Type:</small>
                                  <p class="mb-0">
                                    <span class="badge bg-secondary">{selectedReel.value.type}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="card bg-light border-0 h-100">
                            <div class="card-body p-3">
                              <h6 class="fw-bold text-success mb-2">📊 Statistics</h6>
                              <div class="row text-center">
                                <div class="col-4">
                                  <div class="d-flex flex-column align-items-center">
                                    <EyeIcon style={{ width: '1.2rem', height: '1.2rem' }} class="text-info mb-1" />
                                    <small class="text-muted">Views</small>
                                    <strong>{selectedReel.value.views || 0}</strong>
                                  </div>
                                </div>
                                <div class="col-4">
                                  <div class="d-flex flex-column align-items-center">
                                    <button 
                                      class={`btn btn-sm rounded-circle p-1 ${selectedReel.value.isLiked ? 'btn-danger' : 'btn-outline-danger'}`}
                                      onClick={() => toggleLike(selectedReel.value._id)}
                                      style={{ width: '32px', height: '32px' }}
                                    >
                                      <HeartIcon style={{ width: '1rem', height: '1rem' }} />
                                    </button>
                                    <small class="text-muted mt-1">Likes</small>
                                    <strong>{selectedReel.value.likes || 0}</strong>
                                  </div>
                                </div>
                                <div class="col-4">
                                  <div class="d-flex flex-column align-items-center">
                                    <button 
                                      class="btn btn-outline-warning btn-sm rounded-circle p-1"
                                      onClick={() => incrementShares(selectedReel.value._id)}
                                      style={{ width: '32px', height: '32px' }}
                                    >
                                      <ShareIcon style={{ width: '1rem', height: '1rem' }} />
                                    </button>
                                    <small class="text-muted mt-1">Shares</small>
                                    <strong>{selectedReel.value.shares || 0}</strong>
                                  </div>
                                </div>
                              </div>
                              <hr class="my-2" />
                              <div class="text-center">
                                <small class="text-muted">Status:</small>
                                <div class="mt-1">
                                  {selectedReel.value.isActive ? (
                                    <span class="badge bg-success">✓ Active</span>
                                  ) : (
                                    <span class="badge bg-secondary">✗ Disabled</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Media Content */}
                      <div class="row mb-4">
                        <div class="col-md-6">
                          <div class="card border-0 shadow-sm">
                            <div class="card-header bg-success text-white py-2">
                              <h6 class="mb-0 fw-bold">🎥 Video Content</h6>
                            </div>
                            <div class="card-body p-3">
                              {selectedReel.value.videoUrl ? (
                                <>
                                  <div class="mb-2">
                                    <video 
                                      class="w-100 rounded" 
                                      style={{ maxHeight: '150px', objectFit: 'cover' }}
                                      controls
                                      crossorigin="anonymous"
                                      muted
                                    >
                                      <source src={selectedReel.value.videoUrl} type="video/mp4" />
                                    </video>
                                  </div>
                                  <button 
                                    class="btn btn-success btn-sm w-100"
                                    onClick={() => viewContent(selectedReel.value, 'video')}
                                  >
                                    <PlayIcon style={{ width: '16px', height: '16px' }} class="me-1" />
                                    View Full Video
                                  </button>
                                </>
                              ) : (
                                <div class="text-center text-muted py-3">
                                  <FilmIcon style={{ width: '2rem', height: '2rem' }} class="mb-2" />
                                  <p class="mb-0 small">No video uploaded</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="card border-0 shadow-sm">
                            <div class="card-header bg-info text-white py-2">
                              <h6 class="mb-0 fw-bold">🖼️ Image Content</h6>
                            </div>
                            <div class="card-body p-3">
                              {selectedReel.value.imageUrl ? (
                                <>
                                  <div class="mb-2">
                                    <img 
                                      src={selectedReel.value.imageUrl} 
                                      alt={selectedReel.value.name}
                                      class="w-100 rounded"
                                      style={{ maxHeight: '150px', objectFit: 'cover' }}
                                      crossorigin="anonymous"
                                    />
                                  </div>
                                  <button 
                                    class="btn btn-info btn-sm w-100"
                                    onClick={() => viewContent(selectedReel.value, 'image')}
                                  >
                                    <EyeIcon style={{ width: '16px', height: '16px' }} class="me-1" />
                                    View Full Image
                                  </button>
                                </>
                              ) : (
                                <div class="text-center text-muted py-3">
                                  <FilmIcon style={{ width: '2rem', height: '2rem' }} class="mb-2" />
                                  <p class="mb-0 small">No image uploaded</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Prompts */}
                      <div class="row mb-3">
                        <div class="col-md-6">
                          <div class="card bg-light border-0">
                            <div class="card-body p-3">
                              <h6 class="fw-bold text-info mb-2">🎨 Image Prompt</h6>
                              <p class="mb-0 small" style={{ lineHeight: '1.4' }}>
                                {selectedReel.value.imagePrompt || 'No image prompt provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="card bg-light border-0">
                            <div class="card-body p-3">
                              <h6 class="fw-bold text-warning mb-2">🎬 Video Prompt</h6>
                              <p class="mb-0 small" style={{ lineHeight: '1.4' }}>
                                {selectedReel.value.videoPrompt || 'No video prompt provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div class="card bg-light border-0">
                        <div class="card-body p-3">
                          <h6 class="fw-bold text-secondary mb-2">📅 Metadata</h6>
                          <div class="row small">
                            <div class="col-md-4">
                              <strong>Created:</strong><br />
                              {new Date(selectedReel.value.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div class="col-md-4">
                              <strong>Updated:</strong><br />
                              {new Date(selectedReel.value.updatedAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div class="col-md-4">
                              <strong>ID:</strong><br />
                              <code class="small">{selectedReel.value._id}</code>
                            </div>
                          </div>
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

            {/* Edit Modal */}
            {showEditModal.value && editingReel.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeEditModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PencilIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        Edit Reel
                      </h5>
                      <button type="button" class="btn-close" onClick={closeEditModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label for="edit-reel-name" class="form-label fw-semibold small">Name *</label>
                          <input 
                            id="edit-reel-name"
                            name="name"
                            type="text" 
                            class="form-control rounded-3" 
                            v-model={editingReel.value.name}
                            placeholder="Enter reel name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label for="edit-reel-description" class="form-label fw-semibold small">Description *</label>
                          <textarea 
                            id="edit-reel-description"
                            name="description"
                            class="form-control rounded-3" 
                            rows="3"
                            v-model={editingReel.value.description}
                            placeholder="Enter reel description"
                            required
                          ></textarea>
                        </div>
                        
                        <div class="mb-3">
                          <label for="edit-reel-category" class="form-label fw-semibold small">Category</label>
                          <select 
                            id="edit-reel-category"
                            name="category"
                            class="form-select rounded-3" 
                            v-model={editingReel.value.category}
                          >
                            <option value="Spiritual">Spiritual</option>
                            <option value="Educational">Educational</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Motivational">Motivational</option>
                          </select>
                        </div>
                        
                        <div class="mb-3">
                          <label for="edit-reel-type" class="form-label fw-semibold small">Type</label>
                          <select 
                            id="edit-reel-type"
                            name="type"
                            class="form-select rounded-3" 
                            v-model={editingReel.value.type}
                          >
                            <option value="Reel">Reel</option>
                            <option value="Video">Video</option>
                            <option value="Short">Short</option>
                          </select>
                        </div>
                        
                        <div class="mb-3">
                          <label for="edit-reel-video" class="form-label fw-semibold small">Upload New Video (Optional)</label>
                          {editingReel.value && (editingReel.value.videoUrl || editingReel.value.video) && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">🎥 Current video preview:</small>
                              <video 
                                controls 
                                class="w-100 rounded-3" 
                                style={{ maxHeight: '150px' }}
                                crossorigin="anonymous"
                                onError={(e) => {
                                  console.error('Video load error:', e);
                                  console.log('Video URL:', editingReel.value.videoUrl || editingReel.value.video);
                                }}
                              >
                                <source src={editingReel.value.videoUrl || editingReel.value.video} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                              <div class="mt-1">
                                <small class="text-muted">Current video is available</small>
                              </div>
                            </div>
                          )}
                          {editingReel.value && !editingReel.value.videoUrl && !editingReel.value.video && (
                            <div class="mb-2 p-2 bg-warning bg-opacity-10 rounded">
                              <small class="text-warning">⚠️ No current video found</small>
                            </div>
                          )}
                          <input 
                            id="edit-reel-video"
                            name="video"
                            type="file" 
                            class="form-control rounded-3" 
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                editingReel.value.newVideo = file;
                              }
                            }}
                          />
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
                          <small class="text-muted">Leave empty to keep current video</small>
                        </div>
                        
                        <div class="mb-3">
                          <label for="edit-reel-image" class="form-label fw-semibold small">Upload New Image (Optional)</label>
                          {editingReel.value && (editingReel.value.imageUrl || editingReel.value.image) && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">🖼️ Current image preview:</small>
                              <img 
                                src={editingReel.value.imageUrl || editingReel.value.image} 
                                alt="Current" 
                                class="img-fluid rounded-3" 
                                style={{ maxHeight: '150px' }}
                                crossorigin="anonymous"
                                onError={(e) => {
                                  console.error('Image load error:', e);
                                  console.log('Image URL:', editingReel.value.imageUrl || editingReel.value.image);
                                }}
                              />
                              <div class="mt-1">
                                <small class="text-muted">Current image is available</small>
                              </div>
                            </div>
                          )}
                          {editingReel.value && !editingReel.value.imageUrl && !editingReel.value.image && (
                            <div class="mb-2 p-2 bg-warning bg-opacity-10 rounded">
                              <small class="text-warning">⚠️ No current image found</small>
                            </div>
                          )}
                          <input 
                            id="edit-reel-image"
                            name="image"
                            type="file" 
                            class="form-control rounded-3" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                editingReel.value.newImage = file;
                              }
                            }}
                          />
                          {loading.value && uploadProgress.value.thumbnail > 0 && (
                            <div class="mt-2">
                              <div class="d-flex justify-content-between align-items-center mb-1">
                                <small class="text-primary">Uploading image...</small>
                                <small class="text-primary fw-bold">{uploadProgress.value.thumbnail}%</small>
                              </div>
                              <div class="progress" style={{ height: '6px' }}>
                                <div 
                                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                  style={{ width: `${uploadProgress.value.thumbnail}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                          <small class="text-muted">Leave empty to keep current image</small>
                        </div>
                        
                        <div class="mb-3">
                          <label for="edit-reel-image-prompt" class="form-label fw-semibold small">Image Prompt</label>
                          <textarea 
                            id="edit-reel-image-prompt"
                            name="imagePrompt"
                            class="form-control rounded-3" 
                            rows="2"
                            v-model={editingReel.value.imagePrompt}
                            placeholder="Enter image generation prompt"
                          ></textarea>
                        </div>
                        
                        <div class="mb-3">
                          <label for="edit-reel-video-prompt" class="form-label fw-semibold small">Video Prompt</label>
                          <textarea 
                            id="edit-reel-video-prompt"
                            name="videoPrompt"
                            class="form-control rounded-3" 
                            rows="2"
                            v-model={editingReel.value.videoPrompt}
                            placeholder="Enter video generation prompt"
                          ></textarea>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm me-2" onClick={closeEditModal}>
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-3 btn-sm" 
                        onClick={updateReel}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Updating...' : 'Update'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Preview Modal */}
            {showMediaModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={closeMediaModal}>
                <div class="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0">
                      <h5 class="modal-title fw-bold">
                        {mediaContent.value.type === 'video' ? '🎥 Video Preview' : '🖼️ Image Preview'}
                      </h5>
                      <button type="button" class="btn-close" onClick={closeMediaModal}></button>
                    </div>
                    <div class="modal-body p-0">
                      {mediaContent.value.type === 'video' ? (
                        <video controls class="w-100" style={{ maxHeight: '70vh' }} crossorigin="anonymous">
                          <source src={mediaContent.value.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img src={mediaContent.value.url} alt="Preview" class="w-100" style={{ maxHeight: '70vh', objectFit: 'contain' }} crossorigin="anonymous" />
                      )}
                    </div>
                    <div class="modal-footer border-0">
                      <button type="button" class="btn btn-secondary rounded-pill" onClick={closeMediaModal}>
                        Close
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