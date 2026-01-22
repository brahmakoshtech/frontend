import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  MusicalNoteIcon,
  VideoCameraIcon,
  PhotoIcon,
  LinkIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon
} from '@heroicons/vue/24/outline';
import chantingService from '../../../../services/chantingService';

export default {
  name: 'ChantingActivity',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showModal = ref(false);
    const showMediaModal = ref(false);
    const selectedChanting = ref(null);
    const mediaContent = ref({ type: '', url: '' });
    const chantings = ref([]);
    const loading = ref(false);
    const openDropdownId = ref(null);
    const editingChanting = ref(null);

    const formData = ref({
      name: '',
      customName: '',
      description: '',
      malaCount: 1,
      video: null,
      image: null,
      link: '',
      duration: ''
    });

    const editFormData = ref({
      name: '',
      customName: '',
      description: '',
      malaCount: 1,
      video: null,
      image: null,
      link: '',
      duration: ''
    });

    const videoUploaded = ref(false);
    const videoFileName = ref('');
    const imageUploaded = ref(false);
    const imageFileName = ref('');
    const uploadProgress = ref({ video: 0, image: 0 });

    const editVideoUploaded = ref(false);
    const editVideoFileName = ref('');
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');
    const editUploadProgress = ref({ video: 0, image: 0 });

    const malaOptions = [1, 2, 3, 5, 10, 21, 108];
    
    const chantingNames = [
      'Om Namah Shivaya',
      'Om Mani Padme Hum',
      'Hare Krishna Hare Rama',
      'Gayatri Mantra',
      'Mahamrityunjaya Mantra',
      'Om Gam Ganapataye Namaha',
      'Om Namo Bhagavate Vasudevaya',
      'Om Shanti Shanti Shanti',
      'So Hum',
      'Om Aim Hreem Kleem',
      'Hanuman Chalisa',
      'Durga Mantra',
      'Lakshmi Mantra',
      'Saraswati Mantra',
      'Other'
    ];

    const totalCount = computed(() => formData.value.malaCount * 108);
    const editTotalCount = computed(() => editFormData.value.malaCount * 108);

    const goBack = () => {
      router.push('/client/activity');
    };

    const openModal = (chanting) => {
      selectedChanting.value = chanting;
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      selectedChanting.value = null;
    };

    const viewContent = (chanting, type) => {
      if (!chanting.isActive) return;
      
      if (type === 'video' && chanting.videoUrl) {
        mediaContent.value = { type: 'video', url: chanting.videoUrl };
        showMediaModal.value = true;
      } else if (type === 'image' && chanting.imageUrl) {
        mediaContent.value = { type: 'image', url: chanting.imageUrl };
        showMediaModal.value = true;
      } else if (type === 'link' && chanting.link) {
        window.open(chanting.link, '_blank');
      }
    };

    const closeMediaModal = () => {
      showMediaModal.value = false;
      mediaContent.value = { type: '', url: '' };
    };

    const loadChantings = async () => {
      try {
        loading.value = true;
        const data = await chantingService.getAll();
        chantings.value = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading chantings:', error);
        const errorMsg = error.message || 'Error loading chantings';
        if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          toast.error('Chanting API endpoint not found. Please ensure the server is deployed with the latest routes.');
        } else {
          toast.error(errorMsg);
        }
        chantings.value = []; // Set empty array on error
      } finally {
        loading.value = false;
      }
    };

    const openAddModal = () => {
      showAddModal.value = true;
      formData.value = {
        name: '',
        customName: '',
        description: '',
        malaCount: 1,
        video: null,
        image: null,
        link: '',
        duration: ''
      };
      videoUploaded.value = false;
      videoFileName.value = '';
      imageUploaded.value = false;
      imageFileName.value = '';
    };

    const closeAddModal = () => {
      showAddModal.value = false;
    };

    const openEditModal = (chanting) => {
      editingChanting.value = chanting;
      // Check if the name is in the predefined list
      const isPredefinedName = chantingNames.includes(chanting.name);
      editFormData.value = {
        name: isPredefinedName ? chanting.name : 'Other',
        customName: isPredefinedName ? '' : chanting.name,
        description: chanting.description,
        malaCount: chanting.malaCount,
        link: chanting.link || '',
        duration: chanting.duration || '',
        video: null,
        image: null
      };
      editVideoUploaded.value = false;
      editVideoFileName.value = '';
      editImageUploaded.value = false;
      editImageFileName.value = '';
      showEditModal.value = true;
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      editingChanting.value = null;
    };

    const handleVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        formData.value.video = file;
        videoUploaded.value = true;
        videoFileName.value = file.name;
      }
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        formData.value.image = file;
        imageUploaded.value = true;
        imageFileName.value = file.name;
      }
    };

    const handleEditVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editFormData.value.video = file;
        editVideoUploaded.value = true;
        editVideoFileName.value = file.name;
      }
    };

    const handleEditImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editFormData.value.image = file;
        editImageUploaded.value = true;
        editImageFileName.value = file.name;
      }
    };

    const submitForm = async () => {
      // Validate name
      const chantingName = formData.value.name === 'Other' 
        ? formData.value.customName 
        : formData.value.name;
      
      if (!chantingName || !formData.value.description) {
        toast.error('Name and Description are required');
        return;
      }
      
      try {
        loading.value = true;
        uploadProgress.value = { video: 0, image: 0 };
        
        let videoUrl = null;
        let imageUrl = null;
        
        // Upload video to S3 if provided
        if (formData.value.video) {
          try {
            const { uploadUrl, fileUrl } = await chantingService.getUploadUrl(
              formData.value.video.name,
              formData.value.video.type,
              'video'
            );
            
            await chantingService.uploadToS3(
              uploadUrl,
              formData.value.video,
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
        
        // Upload image to S3 if provided
        if (formData.value.image) {
          try {
            const { uploadUrl, fileUrl } = await chantingService.getUploadUrl(
              formData.value.image.name,
              formData.value.image.type,
              'image'
            );
            
            await chantingService.uploadToS3(
              uploadUrl,
              formData.value.image,
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
        
        // Use customName if "Other" is selected, otherwise use the selected name
        const chantingName = formData.value.name === 'Other' && formData.value.customName 
          ? formData.value.customName 
          : formData.value.name;
        
        // Create chanting with S3 URLs
        await chantingService.createDirect({
          name: chantingName,
          description: formData.value.description,
          malaCount: formData.value.malaCount,
          videoUrl,
          imageUrl,
          link: formData.value.link || undefined,
          duration: formData.value.duration ? Number(formData.value.duration) : undefined
        });
        
        await loadChantings();
        closeAddModal();
        uploadProgress.value = { video: 0, image: 0 };
        toast.success('Chanting added successfully!');
      } catch (error) {
        console.error('Error creating chanting:', error);
        toast.error('Error creating chanting');
      } finally {
        loading.value = false;
      }
    };

    const submitEditForm = async () => {
      // Validate name
      const chantingName = editFormData.value.name === 'Other' 
        ? editFormData.value.customName 
        : editFormData.value.name;
      
      if (!chantingName || !editFormData.value.description) {
        toast.error('Name and Description are required');
        return;
      }
      
      try {
        loading.value = true;
        editUploadProgress.value = { video: 0, image: 0 };
        
        const updateData = {
          name: editFormData.value.name,
          description: editFormData.value.description,
          malaCount: editFormData.value.malaCount,
          link: editFormData.value.link,
          duration: editFormData.value.duration
        };
        
        // Upload new video if provided
        if (editFormData.value.video) {
          try {
            const { uploadUrl, fileUrl } = await chantingService.getUploadUrl(
              editFormData.value.video.name,
              editFormData.value.video.type,
              'video'
            );
            
            await chantingService.uploadToS3(
              uploadUrl,
              editFormData.value.video,
              (progress) => {
                editUploadProgress.value.video = Math.round(progress);
              }
            );
            
            updateData.videoUrl = fileUrl;
          } catch (error) {
            console.error('Video upload failed:', error);
            alert('Video upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Upload new image if provided
        if (editFormData.value.image) {
          try {
            const { uploadUrl, fileUrl } = await chantingService.getUploadUrl(
              editFormData.value.image.name,
              editFormData.value.image.type,
              'image'
            );
            
            await chantingService.uploadToS3(
              uploadUrl,
              editFormData.value.image,
              (progress) => {
                editUploadProgress.value.image = Math.round(progress);
              }
            );
            
            updateData.imageUrl = fileUrl;
          } catch (error) {
            console.error('Image upload failed:', error);
            alert('Image upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Use customName if "Other" is selected, otherwise use the selected name
        const chantingName = editFormData.value.name === 'Other' && editFormData.value.customName 
          ? editFormData.value.customName 
          : editFormData.value.name;
        
        updateData.name = chantingName;
        if (updateData.duration) {
          updateData.duration = Number(updateData.duration);
        }
        
        // Update chanting
        await chantingService.updateDirect(editingChanting.value._id, updateData);
        
        await loadChantings();
        closeEditModal();
        editUploadProgress.value = { video: 0, image: 0 };
        toast.success('Chanting updated successfully!');
      } catch (error) {
        console.error('Error updating chanting:', error);
        toast.error('Error updating chanting');
      } finally {
        loading.value = false;
      }
    };

    const deleteChanting = async (id) => {
      if (confirm('Are you sure you want to delete this chanting?')) {
        try {
          loading.value = true;
          await chantingService.delete(id);
          await loadChantings();
          toast.success('Chanting deleted successfully!');
        } catch (error) {
          console.error('Error deleting chanting:', error);
          toast.error('Error deleting chanting: ' + (error.message || 'Unknown error'));
        } finally {
          loading.value = false;
        }
      }
    };

    const toggleDropdown = (id) => {
      openDropdownId.value = openDropdownId.value === id ? null : id;
    };

    const toggleStatus = async (chanting) => {
      try {
        const response = await chantingService.toggleStatus(chanting._id);
        const index = chantings.value.findIndex(c => c._id === chanting._id);
        if (index !== -1) {
          chantings.value[index] = {
            ...chantings.value[index],
            isActive: response.data.isActive
          };
        }
        openDropdownId.value = null;
        toast.success(`Chanting ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Error updating status');
      }
    };

    onMounted(() => {
      loadChantings();
    });

    return () => (
      <div class="container-fluid px-4 py-3">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
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
                  <h1 class="mb-1 fw-bold fs-2 d-flex align-items-center gap-2">
                    <SparklesIcon style={{ width: '2rem', height: '2rem' }} />
                    Chanting Management
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Upload and manage chanting content</p>
                  {!loading.value && chantings.value.length > 0 && (
                    <small class="d-block mt-1" style={{ opacity: 0.9 }}>
                      {chantings.value.length} total chantings
                    </small>
                  )}
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={openAddModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span class="d-none d-sm-inline">Upload Chanting</span>
                  <span class="d-sm-none">Upload</span>
                </button>
              </div>
            </div>

            {/* Chantings List */}
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-3 p-md-4">
                <h5 class="fw-bold mb-3">Uploaded Chantings</h5>
                {loading.value ? (
                  <div class="text-center py-5">
                    <div class="spinner-border text-warning" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : chantings.value.length > 0 ? (
                  <div class="row g-3">
                    {chantings.value.map(chanting => (
                      <div key={chanting._id} class="col-12 col-md-6 col-lg-4">
                        <div class={`card h-100 border-0 shadow-sm position-relative ${!chanting.isActive ? 'opacity-50' : ''}`} style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
                          {!chanting.isActive && (
                            <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, borderRadius: '16px', cursor: 'default', pointerEvents: 'none' }}>
                              <span class="badge bg-secondary px-3 py-2 rounded-pill shadow d-flex align-items-center gap-2">
                                <XCircleIcon style={{ width: '16px', height: '16px' }} />
                                Disabled
                              </span>
                            </div>
                          )}
                          {/* Image/Video Thumbnail */}
                          {(chanting.videoUrl || chanting.imageUrl) && (
                            <div class="position-relative" style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                              {chanting.videoUrl ? (
                                <>
                                  <video 
                                    class="w-100 h-100"
                                    style={{ objectFit: 'cover', cursor: chanting.isActive ? 'pointer' : 'not-allowed' }}
                                    onClick={() => viewContent(chanting, 'video')}
                                    muted
                                  >
                                    <source src={chanting.videoUrl} type="video/mp4" />
                                  </video>
                                  <div class="position-absolute top-50 start-50 translate-middle">
                                    <button 
                                      class={`btn btn-warning rounded-circle ${!chanting.isActive ? 'disabled' : ''}`}
                                      style={{ width: '60px', height: '60px', cursor: chanting.isActive ? 'pointer' : 'not-allowed' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewContent(chanting, 'video');
                                      }}
                                      disabled={!chanting.isActive}
                                    >
                                      <PlayIcon style={{ width: '24px', height: '24px' }} />
                                    </button>
                                  </div>
                                </>
                              ) : chanting.imageUrl ? (
                                <img 
                                  src={chanting.imageUrl} 
                                  class="w-100 h-100" 
                                  style={{ objectFit: 'cover', cursor: chanting.isActive ? 'pointer' : 'not-allowed' }} 
                                  alt={chanting.name}
                                  onClick={() => viewContent(chanting, 'image')}
                                />
                              ) : null}
                            </div>
                          )}
                          
                          <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="fw-bold mb-0 text-truncate" style={{ maxWidth: '80%' }}>{chanting.name}</h6>
                              <div class="position-relative">
                                <button 
                                  class="btn btn-sm btn-light rounded-circle p-1"
                                  onClick={() => toggleDropdown(chanting._id)}
                                >
                                  <EllipsisVerticalIcon style={{ width: '1rem', height: '1rem' }} />
                                </button>
                                {openDropdownId.value === chanting._id && (
                                  <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ zIndex: 1000, minWidth: '160px', right: '0', top: '100%' }}>
                                    {chanting.isActive && (
                                      <>
                                        <button class="dropdown-item d-flex align-items-center gap-2 py-2 px-3" onClick={() => { openModal(chanting); openDropdownId.value = null; }}>
                                          <EyeIcon style={{ width: '18px', height: '18px' }} />
                                          <span>View Details</span>
                                        </button>
                                        <button class="dropdown-item d-flex align-items-center gap-2 py-2 px-3" onClick={() => { openEditModal(chanting); openDropdownId.value = null; }}>
                                          <PencilIcon style={{ width: '18px', height: '18px' }} />
                                          <span>Edit</span>
                                        </button>
                                      </>
                                    )}
                                    <button class="dropdown-item d-flex align-items-center gap-2 py-2 px-3" onClick={() => toggleStatus(chanting)}>
                                      {chanting.isActive ? (
                                        <XCircleIcon style={{ width: '18px', height: '18px' }} class="text-danger" />
                                      ) : (
                                        <CheckCircleIcon style={{ width: '18px', height: '18px' }} class="text-success" />
                                      )}
                                      <span>{chanting.isActive ? 'Disable' : 'Enable'}</span>
                                    </button>
                                    {chanting.isActive && (
                                      <>
                                        <div class="dropdown-divider"></div>
                                        <button class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger" onClick={() => { deleteChanting(chanting._id); openDropdownId.value = null; }}>
                                          <TrashIcon style={{ width: '18px', height: '18px' }} />
                                          <span>Delete</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <p class="text-muted small mb-2 lh-base" style={{ fontSize: '0.85rem' }}>
                              {chanting.description.length > 80 ? chanting.description.substring(0, 80) + '...' : chanting.description}
                            </p>
                            
                            {/* Content Badges */}
                            <div class="d-flex flex-wrap gap-1 mb-2">
                              {chanting.videoUrl && (
                                <span 
                                  class={`badge bg-success d-flex align-items-center gap-1 ${chanting.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: chanting.isActive ? 'pointer' : 'not-allowed', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                                  onClick={() => viewContent(chanting, 'video')}
                                  title={chanting.isActive ? "Click to view video" : "Content disabled"}
                                >
                                  <VideoCameraIcon style={{ width: '12px', height: '12px' }} />
                                  Video
                                </span>
                              )}
                              {chanting.imageUrl && (
                                <span 
                                  class={`badge bg-info d-flex align-items-center gap-1 ${chanting.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: chanting.isActive ? 'pointer' : 'not-allowed', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                                  onClick={() => viewContent(chanting, 'image')}
                                  title={chanting.isActive ? "Click to view image" : "Content disabled"}
                                >
                                  <PhotoIcon style={{ width: '12px', height: '12px' }} />
                                  Image
                                </span>
                              )}
                              {chanting.link && (
                                <span 
                                  class={`badge bg-primary d-flex align-items-center gap-1 ${chanting.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: chanting.isActive ? 'pointer' : 'not-allowed', fontSize: '0.75rem', padding: '0.35rem 0.5rem' }}
                                  onClick={() => viewContent(chanting, 'link')}
                                  title={chanting.isActive ? "Click to open link" : "Content disabled"}
                                >
                                  <LinkIcon style={{ width: '12px', height: '12px' }} />
                                  Link
                                </span>
                              )}
                            </div>
                            
                            {/* Mala Count */}
                            <div class="d-flex gap-2 mb-2">
                              <span class="badge bg-warning text-dark" style={{ fontSize: '0.8rem' }}>
                                <MusicalNoteIcon style={{ width: '12px', height: '12px' }} class="me-1" />
                                {chanting.malaCount} Mala
                              </span>
                              <span class="badge bg-light text-dark" style={{ fontSize: '0.8rem' }}>
                                {chanting.malaCount * 108} chants
                              </span>
                            </div>
                            
                            {/* Duration */}
                            <div class="d-flex justify-content-between align-items-center">
                              {chanting.duration && (
                                <small class="text-muted d-flex align-items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {chanting.duration} min
                                </small>
                              )}
                              {!chanting.isActive && (
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
                    <SparklesIcon style={{ width: '3rem', height: '3rem' }} class="text-muted mb-3" />
                    <p class="text-muted">No chantings uploaded yet</p>
                    <button class="btn btn-warning" onClick={openAddModal}>Upload First Chanting</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Modal */}
        {showAddModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeAddModal}>
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                <div class="modal-header border-0 pb-0">
                  <h5 class="modal-title fw-bold">Upload New Chanting</h5>
                  <button type="button" class="btn-close" onClick={closeAddModal}></button>
                </div>
                <div class="modal-body p-3 p-md-4">
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Chanting Name *</label>
                    <select 
                      class="form-select"
                      value={formData.value.name}
                      onChange={(e) => formData.value.name = e.target.value}
                    >
                      <option value="">Select Chanting</option>
                      {chantingNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {formData.value.name === 'Other' && (
                      <input 
                        type="text" 
                        class="form-control mt-2" 
                        placeholder="Enter custom chanting name"
                        onInput={(e) => formData.value.customName = e.target.value}
                      />
                    )}
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Description *</label>
                    <textarea 
                      class="form-control" 
                      rows="3"
                      value={formData.value.description}
                      onInput={(e) => formData.value.description = e.target.value}
                      placeholder="Meaning and benefits..."
                    ></textarea>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Mala Count *</label>
                    <select 
                      class="form-select"
                      value={formData.value.malaCount}
                      onChange={(e) => formData.value.malaCount = parseInt(e.target.value)}
                    >
                      {malaOptions.map(count => (
                        <option key={count} value={count}>{count} Mala ({count * 108} chants)</option>
                      ))}
                    </select>
                    <small class="text-muted">Total: {totalCount.value} chants</small>
                  </div>



                  <div class="mb-3">
                    <label class="form-label fw-semibold">Video File</label>
                    <input 
                      type="file" 
                      class="form-control"
                      accept="video/*"
                      onChange={handleVideoUpload}
                    />
                    {videoUploaded.value && (
                      <small class="text-success d-block mt-1">✓ {videoFileName.value}</small>
                    )}
                    {loading.value && uploadProgress.value.video > 0 && (
                      <div class="mt-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <small class="text-warning">Uploading video...</small>
                          <small class="text-warning fw-bold">{uploadProgress.value.video}%</small>
                        </div>
                        <div class="progress" style={{ height: '6px' }}>
                          <div 
                            class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                            style={{ width: `${uploadProgress.value.video}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Thumbnail Image</label>
                    <input 
                      type="file" 
                      class="form-control"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    {imageUploaded.value && (
                      <small class="text-success d-block mt-1">✓ {imageFileName.value}</small>
                    )}
                    {loading.value && uploadProgress.value.image > 0 && (
                      <div class="mt-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <small class="text-warning">Uploading image...</small>
                          <small class="text-warning fw-bold">{uploadProgress.value.image}%</small>
                        </div>
                        <div class="progress" style={{ height: '6px' }}>
                          <div 
                            class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                            style={{ width: `${uploadProgress.value.image}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Chanting Link</label>
                    <input 
                      type="url" 
                      class="form-control"
                      value={formData.value.link}
                      onInput={(e) => formData.value.link = e.target.value}
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Duration (minutes)</label>
                    <input 
                      type="number" 
                      class="form-control"
                      value={formData.value.duration}
                      onInput={(e) => formData.value.duration = e.target.value}
                      placeholder="15"
                    />
                  </div>
                </div>
                <div class="modal-footer border-0 p-3">
                  <button type="button" class="btn btn-secondary" onClick={closeAddModal}>Cancel</button>
                  <button type="button" class="btn btn-warning" onClick={submitForm} disabled={loading.value}>
                    {loading.value ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeEditModal}>
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
                <div class="modal-header border-0 pb-0">
                  <h5 class="modal-title fw-bold">Edit Chanting</h5>
                  <button type="button" class="btn-close" onClick={closeEditModal}></button>
                </div>
                <div class="modal-body p-3 p-md-4">
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Chanting Name *</label>
                    <select 
                      class="form-select"
                      value={editFormData.value.name}
                      onChange={(e) => editFormData.value.name = e.target.value}
                    >
                      <option value="">Select Chanting</option>
                      {chantingNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    {editFormData.value.name === 'Other' && (
                      <input 
                        type="text" 
                        class="form-control mt-2" 
                        placeholder="Enter custom chanting name"
                        onInput={(e) => editFormData.value.customName = e.target.value}
                      />
                    )}
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Description *</label>
                    <textarea 
                      class="form-control" 
                      rows="3"
                      value={editFormData.value.description}
                      onInput={(e) => editFormData.value.description = e.target.value}
                    ></textarea>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Mala Count *</label>
                    <select 
                      class="form-select"
                      value={editFormData.value.malaCount}
                      onChange={(e) => editFormData.value.malaCount = parseInt(e.target.value)}
                    >
                      {malaOptions.map(count => (
                        <option key={count} value={count}>{count} Mala ({count * 108} chants)</option>
                      ))}
                    </select>
                    <small class="text-muted">Total: {editTotalCount.value} chants</small>
                  </div>



                  <div class="mb-3">
                    <label class="form-label fw-semibold">Update Video File</label>
                    {editingChanting.value && editingChanting.value.videoUrl && !editFormData.value.video && (
                      <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                        <small class="text-info d-block mb-1">📹 Current video preview:</small>
                        <video controls class="w-100 rounded-3" style={{ maxHeight: '150px' }}>
                          <source src={editingChanting.value.videoUrl} type="video/mp4" />
                        </video>
                      </div>
                    )}
                    <input 
                      type="file" 
                      class="form-control"
                      accept="video/*"
                      onChange={handleEditVideoUpload}
                    />
                    {editVideoUploaded.value && (
                      <small class="text-success d-block mt-1">✓ {editVideoFileName.value}</small>
                    )}
                    {loading.value && editUploadProgress.value.video > 0 && (
                      <div class="mt-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <small class="text-warning">Uploading video...</small>
                          <small class="text-warning fw-bold">{editUploadProgress.value.video}%</small>
                        </div>
                        <div class="progress" style={{ height: '6px' }}>
                          <div 
                            class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                            style={{ width: `${editUploadProgress.value.video}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {editingChanting.value && editingChanting.value.videoUrl && !editFormData.value.video && (
                      <small class="text-info d-block mt-1">Current video will be kept if no new video is uploaded</small>
                    )}
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Update Thumbnail</label>
                    {editingChanting.value && editingChanting.value.imageUrl && !editFormData.value.image && (
                      <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                        <small class="text-info d-block mb-1">🖼️ Current image preview:</small>
                        <img src={editingChanting.value.imageUrl} alt="Current" class="img-fluid rounded-3" style={{ maxHeight: '150px' }} />
                      </div>
                    )}
                    <input 
                      type="file" 
                      class="form-control"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                    />
                    {editImageUploaded.value && (
                      <small class="text-success d-block mt-1">✓ {editImageFileName.value}</small>
                    )}
                    {loading.value && editUploadProgress.value.image > 0 && (
                      <div class="mt-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <small class="text-warning">Uploading image...</small>
                          <small class="text-warning fw-bold">{editUploadProgress.value.image}%</small>
                        </div>
                        <div class="progress" style={{ height: '6px' }}>
                          <div 
                            class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                            style={{ width: `${editUploadProgress.value.image}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {editingChanting.value && editingChanting.value.imageUrl && !editFormData.value.image && (
                      <small class="text-info d-block mt-1">Current image will be kept if no new image is uploaded</small>
                    )}
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">External Link</label>
                    <input 
                      type="url" 
                      class="form-control"
                      value={editFormData.value.link}
                      onInput={(e) => editFormData.value.link = e.target.value}
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">Duration (minutes)</label>
                    <input 
                      type="number" 
                      class="form-control"
                      value={editFormData.value.duration}
                      onInput={(e) => editFormData.value.duration = e.target.value}
                    />
                  </div>
                </div>
                <div class="modal-footer border-0 p-3">
                  <button type="button" class="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                  <button type="button" class="btn btn-warning" onClick={submitEditForm} disabled={loading.value}>
                    {loading.value ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showModal.value && selectedChanting.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeModal}>
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-header border-0 pb-2">
                  <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                    <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    {selectedChanting.value.name}
                  </h5>
                  <button type="button" class="btn-close" onClick={closeModal}></button>
                </div>
                <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div class="mb-3">
                    <h6 class="fw-semibold mb-2 small text-muted">Description</h6>
                    <p class="mb-0">{selectedChanting.value.description}</p>
                  </div>
                  
                  <div class="mb-3">
                    <h6 class="fw-semibold mb-2 small text-muted">Mala Count</h6>
                    <div class="d-flex gap-2">
                      <span class="badge bg-warning text-dark">{selectedChanting.value.malaCount} Mala</span>
                      <span class="badge bg-light text-dark">{selectedChanting.value.malaCount * 108} chants</span>
                    </div>
                  </div>
                  
                  {selectedChanting.value.duration && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted">Duration</h6>
                      <p class="mb-0">{selectedChanting.value.duration} minutes</p>
                    </div>
                  )}
                  
                  {selectedChanting.value.link && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                        <LinkIcon style={{ width: '16px', height: '16px' }} />
                        Link
                      </h6>
                      <a href={selectedChanting.value.link} target="_blank" class="btn btn-outline-warning btn-sm d-flex align-items-center gap-2" style={{ width: 'fit-content' }}>
                        <LinkIcon style={{ width: '18px', height: '18px' }} />
                        Open Link
                      </a>
                    </div>
                  )}
                  
                  {selectedChanting.value.videoUrl && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                        <PlayIcon style={{ width: '16px', height: '16px' }} />
                        Video
                      </h6>
                      <video controls class="w-100 rounded-3" style={{ maxHeight: '250px' }}>
                        <source src={selectedChanting.value.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  
                  {selectedChanting.value.imageUrl && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                        <PhotoIcon style={{ width: '16px', height: '16px' }} />
                        Image
                      </h6>
                      <img src={selectedChanting.value.imageUrl} alt={selectedChanting.value.name} class="img-fluid rounded-3" />
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
                      Your browser does not support the video tag.
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
    );
  }
};
