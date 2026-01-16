import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PhotoIcon,
  LinkIcon,
  XMarkIcon,
  PowerIcon,
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon,
  ChartBarIcon,
  HandRaisedIcon
} from '@heroicons/vue/24/outline';
import prathanaService from '../../../../services/prathanaService.js';

export default {
  name: 'PrathanaActivity',
  setup() {
    const router = useRouter();
    const showModal = ref(false);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showMediaModal = ref(false);
    const selectedPrayer = ref(null);
    const editingPrayer = ref(null);
    const mediaContent = ref({ type: '', url: '' });
    const prayers = ref([]);
    const loading = ref(false);
    const openDropdownId = ref(null);
    
    const categories = [
      'Morning Prayer',
      'Evening Prayer', 
      'Gratitude Prayer',
      'Peace Prayer',
      'Healing Prayer',
      'Protection Prayer'
    ];

    const formData = ref({
      name: '',
      text: '',
      category: '',
      duration: '',
      videoFile: null,
      thumbnailFile: null,
      youtubeLink: ''
    });

    const videoUploaded = ref(false);
    const videoFileName = ref('');
    const thumbnailUploaded = ref(false);
    const thumbnailFileName = ref('');
    const uploadProgress = ref({ video: 0, thumbnail: 0 });

    const editFormData = ref({
      name: '',
      text: '',
      category: '',
      duration: '',
      videoFile: null,
      thumbnailFile: null,
      youtubeLink: ''
    });

    const editVideoUploaded = ref(false);
    const editVideoFileName = ref('');
    const editThumbnailUploaded = ref(false);
    const editThumbnailFileName = ref('');
    const editUploadProgress = ref({ video: 0, thumbnail: 0 });

    const loadPrayers = async () => {
      try {
        loading.value = true;
        const data = await prathanaService.getAll();
        prayers.value = data;
      } catch (error) {
        console.error('Error loading prayers:', error);
        alert('Error loading prayers');
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push('/client/activity');
    };

    const openModal = (prayer) => {
      selectedPrayer.value = prayer;
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      selectedPrayer.value = null;
    };

    const openAddModal = () => {
      showAddModal.value = true;
      formData.value = {
        name: '',
        text: '',
        category: '',
        duration: '',
        videoFile: null,
        thumbnailFile: null,
        youtubeLink: ''
      };
      videoUploaded.value = false;
      videoFileName.value = '';
      thumbnailUploaded.value = false;
      thumbnailFileName.value = '';
    };

    const closeAddModal = () => {
      showAddModal.value = false;
    };

    const openEditModal = (prayer) => {
      editingPrayer.value = prayer;
      editFormData.value = {
        name: prayer.name,
        text: prayer.text,
        category: prayer.category,
        duration: prayer.duration.toString(),
        videoFile: null,
        thumbnailFile: null,
        youtubeLink: prayer.youtubeLink || ''
      };
      editVideoUploaded.value = false;
      editVideoFileName.value = '';
      editThumbnailUploaded.value = false;
      editThumbnailFileName.value = '';
      showEditModal.value = true;
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      editingPrayer.value = null;
    };

    const handleVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        formData.value.videoFile = file;
        videoUploaded.value = true;
        videoFileName.value = file.name;
      }
    };

    const handleThumbnailUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        formData.value.thumbnailFile = file;
        thumbnailUploaded.value = true;
        thumbnailFileName.value = file.name;
      }
    };

    const handleEditVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editFormData.value.videoFile = file;
        editVideoUploaded.value = true;
        editVideoFileName.value = file.name;
      }
    };

    const handleEditThumbnailUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editFormData.value.thumbnailFile = file;
        editThumbnailUploaded.value = true;
        editThumbnailFileName.value = file.name;
      }
    };

    const submitForm = async () => {
      try {
        loading.value = true;
        uploadProgress.value = { video: 0, thumbnail: 0 };
        
        let videoKey = null;
        let thumbnailKey = null;
        
        // Upload video directly to S3 if provided
        if (formData.value.videoFile) {
          try {
            const { uploadUrl, fileKey } = await prathanaService.getUploadUrl(
              formData.value.videoFile.name,
              formData.value.videoFile.type,
              'video'
            );
            
            await prathanaService.uploadToS3(
              uploadUrl,
              formData.value.videoFile,
              (progress) => {
                uploadProgress.value.video = Math.round(progress);
              }
            );
            
            videoKey = fileKey;
          } catch (error) {
            console.error('Video upload failed:', error);
            alert('Video upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Upload thumbnail directly to S3 if provided
        if (formData.value.thumbnailFile) {
          try {
            const { uploadUrl, fileKey } = await prathanaService.getUploadUrl(
              formData.value.thumbnailFile.name,
              formData.value.thumbnailFile.type,
              'image'
            );
            
            await prathanaService.uploadToS3(
              uploadUrl,
              formData.value.thumbnailFile,
              (progress) => {
                uploadProgress.value.thumbnail = Math.round(progress);
              }
            );
            
            thumbnailKey = fileKey;
          } catch (error) {
            console.error('Thumbnail upload failed:', error);
            alert('Thumbnail upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Create prathana with S3 keys
        const response = await prathanaService.createDirect({
          name: formData.value.name,
          text: formData.value.text,
          category: formData.value.category,
          duration: parseInt(formData.value.duration),
          videoKey,
          thumbnailKey,
          youtubeLink: formData.value.youtubeLink
        });
        
        // Add new prathana to list without reloading
        if (response.success && response.data) {
          prayers.value.unshift(response.data);
        }
        
        closeAddModal();
        uploadProgress.value = { video: 0, thumbnail: 0 };
        alert('Prayer added successfully!');
      } catch (error) {
        console.error('Error creating prayer:', error);
        alert('Error creating prayer');
      } finally {
        loading.value = false;
      }
    };

    const submitEditForm = async () => {
      try {
        loading.value = true;
        editUploadProgress.value = { video: 0, thumbnail: 0 };
        
        const updateData = {
          name: editFormData.value.name,
          text: editFormData.value.text,
          category: editFormData.value.category,
          duration: parseInt(editFormData.value.duration),
          youtubeLink: editFormData.value.youtubeLink
        };
        
        // Upload new video if provided
        if (editFormData.value.videoFile) {
          try {
            const { uploadUrl, fileKey } = await prathanaService.getUploadUrl(
              editFormData.value.videoFile.name,
              editFormData.value.videoFile.type,
              'video'
            );
            
            await prathanaService.uploadToS3(
              uploadUrl,
              editFormData.value.videoFile,
              (progress) => {
                editUploadProgress.value.video = Math.round(progress);
              }
            );
            
            updateData.videoKey = fileKey;
          } catch (error) {
            console.error('Video upload failed:', error);
            alert('Video upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Upload new thumbnail if provided
        if (editFormData.value.thumbnailFile) {
          try {
            const { uploadUrl, fileKey } = await prathanaService.getUploadUrl(
              editFormData.value.thumbnailFile.name,
              editFormData.value.thumbnailFile.type,
              'image'
            );
            
            await prathanaService.uploadToS3(
              uploadUrl,
              editFormData.value.thumbnailFile,
              (progress) => {
                editUploadProgress.value.thumbnail = Math.round(progress);
              }
            );
            
            updateData.thumbnailKey = fileKey;
          } catch (error) {
            console.error('Thumbnail upload failed:', error);
            alert('Thumbnail upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Update prathana
        const response = await prathanaService.updateDirect(editingPrayer.value._id, updateData);
        
        // Update prathana in list without reloading
        if (response.success && response.data) {
          const index = prayers.value.findIndex(p => p._id === editingPrayer.value._id);
          if (index !== -1) {
            // Preserve existing URLs if not updated
            const updatedPrayer = {
              ...response.data,
              videoUrl: response.data.videoUrl || editingPrayer.value.videoUrl,
              thumbnailUrl: response.data.thumbnailUrl || editingPrayer.value.thumbnailUrl,
              videoKey: response.data.videoKey || editingPrayer.value.videoKey,
              thumbnailKey: response.data.thumbnailKey || editingPrayer.value.thumbnailKey
            };
            prayers.value[index] = updatedPrayer;
          }
        }
        
        closeEditModal();
        editUploadProgress.value = { video: 0, thumbnail: 0 };
        alert('Prayer updated successfully!');
      } catch (error) {
        console.error('Error updating prayer:', error);
        alert('Error updating prayer');
      } finally {
        loading.value = false;
      }
    };

    const deletePrayer = async (id) => {
      console.log('🗑️ DELETE BUTTON CLICKED - Prayer ID:', id);
      
      if (confirm('Are you sure you want to PERMANENTLY DELETE this prayer?')) {
        try {
          loading.value = true;
          console.log('Calling DELETE API...');
          
          const response = await prathanaService.delete(id);
          console.log('✅ DELETE API Response:', response);
          
          // Remove prayer from list without reloading
          prayers.value = prayers.value.filter(p => p._id !== id);
          
          alert('Prayer deleted successfully!');
        } catch (error) {
          console.error('❌ Error deleting prayer:', error);
          alert('Error deleting prayer: ' + (error.message || 'Unknown error'));
        } finally {
          loading.value = false;
        }
      }
    };

    const viewContent = (prayer, type) => {
      if (!prayer.isActive) return;
      
      if (type === 'video' && prayer.videoUrl) {
        mediaContent.value = { type: 'video', url: prayer.videoUrl };
        showMediaModal.value = true;
      } else if (type === 'thumbnail' && prayer.thumbnailUrl) {
        mediaContent.value = { type: 'image', url: prayer.thumbnailUrl };
        showMediaModal.value = true;
      } else if (type === 'youtube' && prayer.youtubeLink) {
        window.open(prayer.youtubeLink, '_blank');
      }
    };

    const closeMediaModal = () => {
      showMediaModal.value = false;
      mediaContent.value = { type: '', url: '' };
    };

    const toggleDropdown = (id) => {
      openDropdownId.value = openDropdownId.value === id ? null : id;
    };

    const toggleStatus = async (prayer) => {
      console.log('🔄 TOGGLE STATUS CLICKED - Prayer ID:', prayer._id, 'Current status:', prayer.isActive);
      try {
        const response = await prathanaService.toggleStatus(prayer._id);
        console.log('✅ Toggle status successful. New status:', response.data.isActive);
        const index = prayers.value.findIndex(p => p._id === prayer._id);
        if (index !== -1) {
          prayers.value[index] = {
            ...prayers.value[index],
            isActive: response.data.isActive
          };
        }
        openDropdownId.value = null;
        alert(`Prayer ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('❌ Error toggling status:', error);
        alert('Error updating status');
      }
    };

    onMounted(() => {
      loadPrayers();
    });

    return () => (
      <div class="container-fluid px-4 py-3">
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
                  <span class="d-none d-sm-inline">Back to Activity</span>
                  <span class="d-sm-none">Back</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2 text-dark d-flex align-items-center gap-2">
                    <HeartIcon style={{ width: '2rem', height: '2rem' }} class="text-primary" />
                    Prathana Management
                  </h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>Upload and manage prayer content for users</p>
                  {!loading.value && prayers.value.length > 0 && (
                    <small class="text-dark d-block mt-1 d-flex align-items-center gap-1" style={{ opacity: 0.8 }}>
                      <ChartBarIcon style={{ width: '16px', height: '16px' }} />
                      {prayers.value.length} total prayers
                    </small>
                  )}
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={openAddModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span class="d-none d-sm-inline">Add Prathana</span>
                  <span class="d-sm-none">Add</span>
                </button>
              </div>
            </div>

            {/* Prayers List */}
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-3 p-md-4">
                <h5 class="fw-bold mb-3">Uploaded Prayers</h5>
                {loading.value ? (
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : prayers.value.length > 0 ? (
                  <div class="row g-3">
                    {prayers.value.map(prayer => (
                      <div key={prayer._id} class="col-12 col-md-6 col-lg-4">
                        <div class={`card h-100 border-0 shadow-sm position-relative ${!prayer.isActive ? 'opacity-50' : ''}`} style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
                          {!prayer.isActive && (
                            <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, borderRadius: '16px', cursor: 'default' }}>
                              <span class="badge bg-secondary px-3 py-2 rounded-pill shadow d-flex align-items-center gap-2">
                                <XCircleIcon style={{ width: '16px', height: '16px' }} />
                                Disabled
                              </span>
                            </div>
                          )}
                          
                          {/* Card Media */}
                          {(prayer.videoUrl || prayer.thumbnailUrl) && (
                            <div class="position-relative" style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                              {prayer.videoUrl ? (
                                <>
                                  <video 
                                    class="w-100 h-100"
                                    style={{ objectFit: 'cover', cursor: prayer.isActive ? 'pointer' : 'not-allowed' }}
                                    onClick={() => viewContent(prayer, 'video')}
                                    muted
                                  >
                                    <source src={prayer.videoUrl} type="video/mp4" />
                                  </video>
                                  <div class="position-absolute top-50 start-50 translate-middle">
                                    <button 
                                      class={`btn btn-primary rounded-circle ${!prayer.isActive ? 'disabled' : ''}`}
                                      style={{ width: '60px', height: '60px', cursor: prayer.isActive ? 'pointer' : 'not-allowed' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewContent(prayer, 'video');
                                      }}
                                      disabled={!prayer.isActive}
                                    >
                                      <PlayIcon style={{ width: '24px', height: '24px' }} />
                                    </button>
                                  </div>
                                </>
                              ) : prayer.thumbnailUrl ? (
                                <img 
                                  src={prayer.thumbnailUrl} 
                                  alt={prayer.name}
                                  class="w-100 h-100"
                                  style={{ objectFit: 'cover', cursor: prayer.isActive ? 'pointer' : 'not-allowed' }}
                                  onClick={() => viewContent(prayer, 'thumbnail')}
                                />
                              ) : (
                                <div class="w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                                  <HeartIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} />
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="fw-bold mb-0 text-truncate" style={{ fontSize: '1rem' }}>{prayer.name}</h6>
                              <div class="dropdown position-relative">
                                <button 
                                  class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                  onClick={() => toggleDropdown(prayer._id)}
                                  style={{ width: '40px', height: '40px', position: 'relative', zIndex: 10 }}
                                >
                                  <EllipsisVerticalIcon style={{ width: '20px', height: '20px' }} />
                                </button>
                                {openDropdownId.value === prayer._id && (
                                  <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '160px', right: '0', top: '100%', zIndex: 1000 }}>
                                    {prayer.isActive && (
                                      <>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                          onClick={() => { openModal(prayer); openDropdownId.value = null; }}
                                        >
                                          <EyeIcon style={{ width: '18px', height: '18px' }} />
                                          <span>View Details</span>
                                        </button>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                          onClick={() => { openEditModal(prayer); openDropdownId.value = null; }}
                                        >
                                          <PencilIcon style={{ width: '18px', height: '18px' }} />
                                          <span>Edit</span>
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                      onClick={() => toggleStatus(prayer)}
                                    >
                                      {prayer.isActive ? (
                                        <XCircleIcon style={{ width: '18px', height: '18px' }} class="text-danger" />
                                      ) : (
                                        <CheckCircleIcon style={{ width: '18px', height: '18px' }} class="text-success" />
                                      )}
                                      <span>{prayer.isActive ? 'Disable' : 'Enable'}</span>
                                    </button>
                                    {prayer.isActive && (
                                      <>
                                        <div class="dropdown-divider"></div>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger"
                                          onClick={() => { deletePrayer(prayer._id); openDropdownId.value = null; }}
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
                              {prayer.text.length > 80 ? prayer.text.substring(0, 80) + '...' : prayer.text}
                            </p>
                            
                            {/* Content Badges */}
                            <div class="d-flex flex-wrap gap-1 mb-3">
                              {prayer.videoUrl && (
                                <span 
                                  class={`badge bg-success d-flex align-items-center gap-1 ${prayer.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: prayer.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(prayer, 'video')}
                                  title={prayer.isActive ? "Click to view video" : "Content disabled"}
                                >
                                  <PlayIcon style={{ width: '14px', height: '14px' }} />
                                  Video
                                </span>
                              )}
                              {prayer.thumbnailUrl && (
                                <span 
                                  class={`badge bg-info d-flex align-items-center gap-1 ${prayer.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: prayer.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(prayer, 'thumbnail')}
                                  title={prayer.isActive ? "Click to view thumbnail" : "Content disabled"}
                                >
                                  <PhotoIcon style={{ width: '14px', height: '14px' }} />
                                  Thumbnail
                                </span>
                              )}
                              {prayer.youtubeLink && (
                                <span 
                                  class={`badge bg-warning d-flex align-items-center gap-1 ${prayer.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: prayer.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(prayer, 'youtube')}
                                  title={prayer.isActive ? "Click to open YouTube" : "Content disabled"}
                                >
                                  <LinkIcon style={{ width: '14px', height: '14px' }} />
                                  YouTube
                                </span>
                              )}
                              <span class="badge bg-danger bg-opacity-10 text-danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>
                                {prayer.category}
                              </span>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                              <small class="text-muted">
                                {prayer.duration} min • {new Date(prayer.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </small>
                              {!prayer.isActive && (
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
                      <HeartIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                    </div>
                    <h4 class="text-muted mb-3">No prayers uploaded yet</h4>
                    <p class="text-muted mb-4">Create your first prayer to help users connect spiritually</p>
                    <button 
                      class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
                      onClick={openAddModal}
                      style={{ fontWeight: '600' }}
                    >
                      <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} class="me-2" />
                      Add First Prayer
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Modal */}
            {showModal.value && selectedPrayer.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        {selectedPrayer.value.name}
                      </h5>
                      <button type="button" class="btn-close" onClick={closeModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Prayer Text</h6>
                        <p class="mb-0">{selectedPrayer.value.text}</p>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Details</h6>
                        <div class="d-flex gap-3">
                          <span class="badge bg-danger">{selectedPrayer.value.category}</span>
                          <span class="badge bg-secondary">{selectedPrayer.value.duration} minutes</span>
                        </div>
                      </div>
                      
                      {selectedPrayer.value.youtubeLink && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <LinkIcon style={{ width: '16px', height: '16px' }} />
                            YouTube Link
                          </h6>
                          <a href={selectedPrayer.value.youtubeLink} target="_blank" class="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" style={{ width: 'fit-content' }}>
                            <LinkIcon style={{ width: '18px', height: '18px' }} />
                            Open YouTube
                          </a>
                        </div>
                      )}
                      
                      {selectedPrayer.value.videoUrl && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <PlayIcon style={{ width: '16px', height: '16px' }} />
                            Video
                          </h6>
                          <video controls class="w-100 rounded-3" style={{ maxHeight: '250px' }}>
                            <source src={selectedPrayer.value.videoUrl} type="video/mp4" />
                          </video>
                        </div>
                      )}
                      
                      {selectedPrayer.value.thumbnailUrl && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <PhotoIcon style={{ width: '16px', height: '16px' }} />
                            Thumbnail
                          </h6>
                          <img src={selectedPrayer.value.thumbnailUrl} alt={selectedPrayer.value.name} class="img-fluid rounded-3" />
                        </div>
                      )}
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={closeModal}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeAddModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PlusIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        Add New Prayer
                      </h5>
                      <button type="button" class="btn-close" onClick={closeAddModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Prayer Name *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            v-model={formData.value.name}
                            placeholder="Enter prayer name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Category *</label>
                          <select class="form-select rounded-3" v-model={formData.value.category} required>
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Prayer Text *</label>
                          <textarea 
                            class="form-control rounded-3" 
                            rows="4"
                            v-model={formData.value.text}
                            placeholder="Enter prayer text"
                            required
                          ></textarea>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Duration (minutes) *</label>
                          <input 
                            type="number" 
                            class="form-control rounded-3" 
                            v-model={formData.value.duration}
                            placeholder="Enter duration in minutes"
                            min="1"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Upload Video</label>
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
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
                              <div class="progress" style={{ height: '6px' }}>
                                <div 
                                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                                  style={{ width: `${uploadProgress.value.video}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Upload Thumbnail</label>
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            accept="image/*"
                            onChange={handleThumbnailUpload}
                          />
                          {thumbnailUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success">
                                ✓ Thumbnail uploaded: {thumbnailFileName.value}
                              </small>
                            </div>
                          )}
                          {loading.value && uploadProgress.value.thumbnail > 0 && (
                            <div class="mt-2">
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
                          <label class="form-label fw-semibold small">YouTube Link (Optional)</label>
                          <input 
                            type="url" 
                            class="form-control rounded-3" 
                            v-model={formData.value.youtubeLink}
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm me-2" onClick={closeAddModal}>
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-3 btn-sm" 
                        onClick={submitForm}
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
            {showEditModal.value && editingPrayer.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeEditModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PencilIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        Edit Prayer
                      </h5>
                      <button type="button" class="btn-close" onClick={closeEditModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Prayer Name *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            v-model={editFormData.value.name}
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Category *</label>
                          <select class="form-select rounded-3" v-model={editFormData.value.category} required>
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Prayer Text *</label>
                          <textarea 
                            class="form-control rounded-3" 
                            rows="4"
                            v-model={editFormData.value.text}
                            required
                          ></textarea>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Duration (minutes) *</label>
                          <input 
                            type="number" 
                            class="form-control rounded-3" 
                            v-model={editFormData.value.duration}
                            min="1"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Upload New Video (Optional)</label>
                          {editingPrayer.value.videoUrl && !editFormData.value.videoFile && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">📹 Current video preview:</small>
                              <video controls class="w-100 rounded-3" style={{ maxHeight: '150px' }}>
                                <source src={editingPrayer.value.videoUrl} type="video/mp4" />
                              </video>
                            </div>
                          )}
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
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
                          {editingPrayer.value.videoUrl && !editFormData.value.videoFile && (
                            <small class="text-info d-block mt-1">Current video will be kept if no new video is uploaded</small>
                          )}
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Upload New Thumbnail (Optional)</label>
                          {editingPrayer.value.thumbnailUrl && !editFormData.value.thumbnailFile && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">🖼️ Current thumbnail preview:</small>
                              <img src={editingPrayer.value.thumbnailUrl} alt="Current" class="img-fluid rounded-3" style={{ maxHeight: '150px' }} />
                            </div>
                          )}
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            accept="image/*"
                            onChange={handleEditThumbnailUpload}
                          />
                          {editThumbnailUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success">
                                ✓ Thumbnail uploaded: {editThumbnailFileName.value}
                              </small>
                            </div>
                          )}
                          {editingPrayer.value.thumbnailUrl && !editFormData.value.thumbnailFile && (
                            <small class="text-info d-block mt-1">Current thumbnail will be kept if no new thumbnail is uploaded</small>
                          )}
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">YouTube Link (Optional)</label>
                          <input 
                            type="url" 
                            class="form-control rounded-3" 
                            v-model={editFormData.value.youtubeLink}
                            placeholder="https://youtube.com/watch?v=..."
                          />
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
                        onClick={submitEditForm}
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
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        {mediaContent.value.type === 'video' ? (
                          <PlayIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        ) : (
                          <PhotoIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        )}
                        {mediaContent.value.type === 'video' ? 'Video Preview' : 'Image Preview'}
                      </h5>
                      <button type="button" class="btn-close" onClick={closeMediaModal}></button>
                    </div>
                    <div class="modal-body p-0">
                      {mediaContent.value.type === 'video' ? (
                        <video controls class="w-100" style={{ maxHeight: '70vh' }}>
                          <source src={mediaContent.value.url} type="video/mp4" />
                        </video>
                      ) : (
                        <img src={mediaContent.value.url} alt="Preview" class="w-100" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
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
          </div>
        </div>
      </div>
    );
  }
};