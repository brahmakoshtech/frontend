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
  ChartBarIcon
} from '@heroicons/vue/24/outline';
import meditationService from '../../../../services/meditationService';

export default {
  name: 'MeditationActivity',
  setup() {
    const router = useRouter();
    const showModal = ref(false);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showMediaModal = ref(false);
    const selectedMeditation = ref(null);
    const editingMeditation = ref(null);
    const mediaContent = ref({ type: '', url: '' });
    const meditations = ref([]);
    const loading = ref(false);
    const openDropdownId = ref(null);
    const formData = ref({
      name: '',
      description: '',
      video: null,
      link: '',
      image: null
    });
    const videoUploaded = ref(false);
    const videoFileName = ref('');
    const imageUploaded = ref(false);
    const imageFileName = ref('');
    const uploadProgress = ref({ video: 0, image: 0 });
    const editFormData = ref({
      name: '',
      description: '',
      video: null,
      link: '',
      image: null
    });
    const editVideoUploaded = ref(false);
    const editVideoFileName = ref('');
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');
    const editUploadProgress = ref({ video: 0, image: 0 });

    const loadMeditations = async () => {
      try {
        loading.value = true;
        const data = await meditationService.getAll();
        meditations.value = data;
      } catch (error) {
        console.error('Error loading meditations:', error);
        alert('Error loading meditations');
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push('/client/activity');
    };

    const openModal = (meditation) => {
      selectedMeditation.value = meditation;
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      selectedMeditation.value = null;
    };

    const openAddModal = () => {
      showAddModal.value = true;
      formData.value = {
        name: '',
        description: '',
        video: null,
        link: '',
        image: null
      };
      videoUploaded.value = false;
      videoFileName.value = '';
      imageUploaded.value = false;
      imageFileName.value = '';
    };

    const closeAddModal = () => {
      showAddModal.value = false;
    };

    const openEditModal = (meditation) => {
      editingMeditation.value = meditation;
      editFormData.value = {
        name: meditation.name,
        description: meditation.description,
        link: meditation.link || '',
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
      editingMeditation.value = null;
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
      try {
        loading.value = true;
        uploadProgress.value = { video: 0, image: 0 };
        
        let videoUrl = null;
        let imageUrl = null;
        
        // Upload video directly to S3 if provided
        if (formData.value.video) {
          try {
            const { uploadUrl, fileUrl } = await meditationService.getUploadUrl(
              formData.value.video.name,
              formData.value.video.type,
              'video'
            );
            
            await meditationService.uploadToS3(
              uploadUrl,
              formData.value.video,
              (progress) => {
                uploadProgress.value.video = Math.round(progress);
              }
            );
            
            videoUrl = fileUrl;
          } catch (error) {
            console.error('Video upload failed:', error);
            alert('Video upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Upload image directly to S3 if provided
        if (formData.value.image) {
          try {
            const { uploadUrl, fileUrl } = await meditationService.getUploadUrl(
              formData.value.image.name,
              formData.value.image.type,
              'image'
            );
            
            await meditationService.uploadToS3(
              uploadUrl,
              formData.value.image,
              (progress) => {
                uploadProgress.value.image = Math.round(progress);
              }
            );
            
            imageUrl = fileUrl;
          } catch (error) {
            console.error('Image upload failed:', error);
            alert('Image upload failed: ' + (error.message || 'Unknown error'));
            loading.value = false;
            return;
          }
        }
        
        // Create meditation with S3 URLs
        await meditationService.createDirect({
          name: formData.value.name,
          description: formData.value.description,
          link: formData.value.link,
          videoUrl,
          imageUrl
        });
        
        await loadMeditations();
        closeAddModal();
        uploadProgress.value = { video: 0, image: 0 };
        alert('Meditation added successfully!');
      } catch (error) {
        console.error('Error creating meditation:', error);
        alert('Error creating meditation');
      } finally {
        loading.value = false;
      }
    };

    const submitEditForm = async () => {
      try {
        loading.value = true;
        editUploadProgress.value = { video: 0, image: 0 };
        
        const updateData = {
          name: editFormData.value.name,
          description: editFormData.value.description,
          link: editFormData.value.link
        };
        
        // Upload new video if provided
        if (editFormData.value.video) {
          try {
            const { uploadUrl, fileUrl } = await meditationService.getUploadUrl(
              editFormData.value.video.name,
              editFormData.value.video.type,
              'video'
            );
            
            await meditationService.uploadToS3(
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
            const { uploadUrl, fileUrl } = await meditationService.getUploadUrl(
              editFormData.value.image.name,
              editFormData.value.image.type,
              'image'
            );
            
            await meditationService.uploadToS3(
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
        
        // Update meditation
        await meditationService.updateDirect(editingMeditation.value._id, updateData);
        
        await loadMeditations();
        closeEditModal();
        editUploadProgress.value = { video: 0, image: 0 };
        alert('Meditation updated successfully!');
      } catch (error) {
        console.error('Error updating meditation:', error);
        alert('Error updating meditation');
      } finally {
        loading.value = false;
      }
    };

    const deleteMeditation = async (id) => {
      console.log('🗑️ DELETE BUTTON CLICKED - Meditation ID:', id);
      console.log('Current meditations count:', meditations.value.length);
      console.log('Meditation to delete:', meditations.value.find(m => m._id === id));
      
      if (confirm('Are you sure you want to PERMANENTLY DELETE this meditation?')) {
        try {
          loading.value = true;
          console.log('Calling DELETE API...');
          
          const response = await meditationService.delete(id);
          console.log('✅ DELETE API Response:', response);
          
          console.log('Reloading meditations list...');
          await loadMeditations();
          
          console.log('New meditations count:', meditations.value.length);
          console.log('Deleted meditation still exists?', meditations.value.find(m => m._id === id));
          
          alert('Meditation deleted successfully!');
        } catch (error) {
          console.error('❌ Error deleting meditation:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          alert('Error deleting meditation: ' + (error.message || 'Unknown error'));
        } finally {
          loading.value = false;
        }
      } else {
        console.log('Delete cancelled by user');
      }
    };

    const viewContent = (meditation, type) => {
      // Disable content viewing if meditation is not active
      if (!meditation.isActive) {
        return;
      }
      
      if (type === 'video' && meditation.videoUrl) {
        mediaContent.value = { type: 'video', url: meditation.videoUrl };
        showMediaModal.value = true;
      } else if (type === 'image' && meditation.imageUrl) {
        mediaContent.value = { type: 'image', url: meditation.imageUrl };
        showMediaModal.value = true;
      } else if (type === 'link' && meditation.link) {
        window.open(meditation.link, '_blank');
      }
    };

    const closeMediaModal = () => {
      showMediaModal.value = false;
      mediaContent.value = { type: '', url: '' };
    };

    const toggleDropdown = (id) => {
      openDropdownId.value = openDropdownId.value === id ? null : id;
    };

    const toggleStatus = async (meditation) => {
      console.log('🔄 TOGGLE STATUS CLICKED - Meditation ID:', meditation._id, 'Current status:', meditation.isActive);
      try {
        const response = await meditationService.toggleStatus(meditation._id);
        console.log('✅ Toggle status successful. New status:', response.data.isActive);
        const index = meditations.value.findIndex(m => m._id === meditation._id);
        if (index !== -1) {
          meditations.value[index] = {
            ...meditations.value[index],
            isActive: response.data.isActive
          };
        }
        openDropdownId.value = null;
        alert(`Meditation ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
      } catch (error) {
        console.error('❌ Error toggling status:', error);
        alert('Error updating status');
      }
    };

    onMounted(() => {
      loadMeditations();
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
                    Meditation Management
                  </h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>Upload and manage meditation content for users</p>
                  {!loading.value && meditations.value.length > 0 && (
                    <small class="text-dark d-block mt-1 d-flex align-items-center gap-1" style={{ opacity: 0.8 }}>
                      <ChartBarIcon style={{ width: '16px', height: '16px' }} />
                      {meditations.value.length} total meditations
                    </small>
                  )}
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={openAddModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span class="d-none d-sm-inline">Upload Meditation</span>
                  <span class="d-sm-none">Upload</span>
                </button>
              </div>
            </div>

            {/* Meditations List */}
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-3 p-md-4">
                <h5 class="fw-bold mb-3">Uploaded Meditations</h5>
                {loading.value ? (
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : meditations.value.length > 0 ? (
                  <div class="row g-3">
                    {meditations.value.map(meditation => (
                      <div key={meditation._id} class="col-12 col-md-6 col-lg-4">
                        <div class={`card h-100 border-0 shadow-sm position-relative ${!meditation.isActive ? 'opacity-50' : ''}`} style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
                          {!meditation.isActive && (
                            <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, borderRadius: '16px', cursor: 'default' }}>
                              <span class="badge bg-secondary px-3 py-2 rounded-pill shadow d-flex align-items-center gap-2">
                                <XCircleIcon style={{ width: '16px', height: '16px' }} />
                                Disabled
                              </span>
                            </div>
                          )}
                          
                          {/* Card Media */}
                          {(meditation.videoUrl || meditation.imageUrl) && (
                            <div class="position-relative" style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                              {meditation.videoUrl ? (
                                // Video thumbnail with play button
                                <>
                                  <video 
                                    class="w-100 h-100"
                                    style={{ objectFit: 'cover', cursor: meditation.isActive ? 'pointer' : 'not-allowed' }}
                                    onClick={() => viewContent(meditation, 'video')}
                                    muted
                                  >
                                    <source src={meditation.videoUrl} type="video/mp4" />
                                  </video>
                                  <div class="position-absolute top-50 start-50 translate-middle">
                                    <button 
                                      class={`btn btn-primary rounded-circle ${!meditation.isActive ? 'disabled' : ''}`}
                                      style={{ width: '60px', height: '60px', cursor: meditation.isActive ? 'pointer' : 'not-allowed' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        viewContent(meditation, 'video');
                                      }}
                                      disabled={!meditation.isActive}
                                    >
                                      <PlayIcon style={{ width: '24px', height: '24px' }} />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                // Image only
                                <img 
                                  src={meditation.imageUrl} 
                                  alt={meditation.name}
                                  class="w-100 h-100"
                                  style={{ objectFit: 'cover', cursor: meditation.isActive ? 'pointer' : 'not-allowed' }}
                                  onClick={() => viewContent(meditation, 'image')}
                                />
                              )}
                            </div>
                          )}
                          
                          <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="fw-bold mb-0 text-truncate" style={{ fontSize: '1rem' }}>{meditation.name}</h6>
                              <div class="dropdown position-relative">
                                <button 
                                  class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                  onClick={() => toggleDropdown(meditation._id)}
                                  style={{ width: '40px', height: '40px', position: 'relative', zIndex: 10 }}
                                >
                                  <EllipsisVerticalIcon style={{ width: '20px', height: '20px' }} />
                                </button>
                                {openDropdownId.value === meditation._id && (
                                  <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '160px', right: '0', top: '100%', zIndex: 1000 }}>
                                    {meditation.isActive && (
                                      <>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                          onClick={() => { openModal(meditation); openDropdownId.value = null; }}
                                        >
                                          <EyeIcon style={{ width: '18px', height: '18px' }} />
                                          <span>View Details</span>
                                        </button>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                          onClick={() => { openEditModal(meditation); openDropdownId.value = null; }}
                                        >
                                          <PencilIcon style={{ width: '18px', height: '18px' }} />
                                          <span>Edit</span>
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                      onClick={() => toggleStatus(meditation)}
                                    >
                                      {meditation.isActive ? (
                                        <XCircleIcon style={{ width: '18px', height: '18px' }} class="text-danger" />
                                      ) : (
                                        <CheckCircleIcon style={{ width: '18px', height: '18px' }} class="text-success" />
                                      )}
                                      <span>{meditation.isActive ? 'Disable' : 'Enable'}</span>
                                    </button>
                                    {meditation.isActive && (
                                      <>
                                        <div class="dropdown-divider"></div>
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger"
                                          onClick={() => { deleteMeditation(meditation._id); openDropdownId.value = null; }}
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
                              {meditation.description.length > 80 ? meditation.description.substring(0, 80) + '...' : meditation.description}
                            </p>
                            
                            {/* Content Badges */}
                            <div class="d-flex flex-wrap gap-1 mb-3">
                              {meditation.videoUrl && (
                                <span 
                                  class={`badge bg-success d-flex align-items-center gap-1 ${meditation.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: meditation.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(meditation, 'video')}
                                  title={meditation.isActive ? "Click to view video" : "Content disabled"}
                                >
                                  <PlayIcon style={{ width: '14px', height: '14px' }} />
                                  Video
                                </span>
                              )}
                              {meditation.imageUrl && (
                                <span 
                                  class={`badge bg-info d-flex align-items-center gap-1 ${meditation.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: meditation.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(meditation, 'image')}
                                  title={meditation.isActive ? "Click to view image" : "Content disabled"}
                                >
                                  <PhotoIcon style={{ width: '14px', height: '14px' }} />
                                  Image
                                </span>
                              )}
                              {meditation.link && (
                                <span 
                                  class={`badge bg-warning d-flex align-items-center gap-1 ${meditation.isActive ? 'cursor-pointer' : ''}`}
                                  style={{ cursor: meditation.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                  onClick={() => viewContent(meditation, 'link')}
                                  title={meditation.isActive ? "Click to open link" : "Content disabled"}
                                >
                                  <LinkIcon style={{ width: '14px', height: '14px' }} />
                                  Link
                                </span>
                              )}
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                              <small class="text-muted">
                                {new Date(meditation.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </small>
                              {!meditation.isActive && (
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
                    <h4 class="text-muted mb-3">No meditations uploaded yet</h4>
                    <p class="text-muted mb-4">Create your first meditation to help users find peace and mindfulness</p>
                    <button 
                      class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
                      onClick={openAddModal}
                      style={{ fontWeight: '600' }}
                    >
                      <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} class="me-2" />
                      Upload First Meditation
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Modal */}
            {showModal.value && selectedMeditation.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        {selectedMeditation.value.name}
                      </h5>
                      <button type="button" class="btn-close" onClick={closeModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Description</h6>
                        <p class="mb-0">{selectedMeditation.value.description}</p>
                      </div>
                      
                      {selectedMeditation.value.link && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <LinkIcon style={{ width: '16px', height: '16px' }} />
                            Link
                          </h6>
                          <a href={selectedMeditation.value.link} target="_blank" class="btn btn-outline-primary btn-sm d-flex align-items-center gap-2" style={{ width: 'fit-content' }}>
                            <LinkIcon style={{ width: '18px', height: '18px' }} />
                            Open Link
                          </a>
                        </div>
                      )}
                      
                      {selectedMeditation.value.videoUrl && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <PlayIcon style={{ width: '16px', height: '16px' }} />
                            Video
                          </h6>
                          <video controls class="w-100 rounded-3" style={{ maxHeight: '250px' }}>
                            <source src={selectedMeditation.value.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      
                      {selectedMeditation.value.imageUrl && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <PhotoIcon style={{ width: '16px', height: '16px' }} />
                            Image
                          </h6>
                          <img src={selectedMeditation.value.imageUrl} alt={selectedMeditation.value.name} class="img-fluid rounded-3" />
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
                        Upload New Meditation
                      </h5>
                      <button type="button" class="btn-close" onClick={closeAddModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Name *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            v-model={formData.value.name}
                            placeholder="Enter meditation name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Description *</label>
                          <textarea 
                            class="form-control rounded-3" 
                            rows="3"
                            v-model={formData.value.description}
                            placeholder="Enter meditation description"
                            required
                          ></textarea>
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
                          <label class="form-label fw-semibold small">Link (Optional)</label>
                          <input 
                            type="url" 
                            class="form-control rounded-3" 
                            v-model={formData.value.link}
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Upload Image</label>
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
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

            {/* Edit Modal */}
            {showEditModal.value && editingMeditation.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeEditModal}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PencilIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        Edit Meditation
                      </h5>
                      <button type="button" class="btn-close" onClick={closeEditModal}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Name *</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            v-model={editFormData.value.name}
                            placeholder="Enter meditation name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Description *</label>
                          <textarea 
                            class="form-control rounded-3" 
                            rows="3"
                            v-model={editFormData.value.description}
                            placeholder="Enter meditation description"
                            required
                          ></textarea>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Upload New Video (Optional)</label>
                          {editingMeditation.value.videoUrl && !editFormData.value.video && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">📹 Current video preview:</small>
                              <video controls class="w-100 rounded-3" style={{ maxHeight: '150px' }}>
                                <source src={editingMeditation.value.videoUrl} type="video/mp4" />
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
                          {editingMeditation.value.videoUrl && !editFormData.value.video && (
                            <small class="text-info d-block mt-1">Current video will be kept if no new video is uploaded</small>
                          )}
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Link (Optional)</label>
                          <input 
                            type="url" 
                            class="form-control rounded-3" 
                            v-model={editFormData.value.link}
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold small">Upload New Image (Optional)</label>
                          {editingMeditation.value.imageUrl && !editFormData.value.image && (
                            <div class="mb-2 p-2 bg-info bg-opacity-10 rounded">
                              <small class="text-info d-block mb-1">🖼️ Current image preview:</small>
                              <img src={editingMeditation.value.imageUrl} alt="Current" class="img-fluid rounded-3" style={{ maxHeight: '150px' }} />
                            </div>
                          )}
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
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
                          {editingMeditation.value.imageUrl && !editFormData.value.image && (
                            <small class="text-info d-block mt-1">Current image will be kept if no new image is uploaded</small>
                          )}
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
          </div>
        </div>
      </div>
    );
  }
};
