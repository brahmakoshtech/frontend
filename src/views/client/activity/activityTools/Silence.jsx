import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

export default {
  name: 'Silence',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const loading = ref(false);
    const silences = ref([]);
    const showUploadModal = ref(false);
    const uploadForm = ref({
      title: '',
      description: '',
      duration: '',
      audioFile: null,
      imageFile: null
    });

    const loadSilences = async () => {
      try {
        loading.value = true;
        // API call would go here
        // const response = await api.getSilences();
        // silences.value = response.data;
        
        // Mock data for now
        silences.value = [
          {
            id: 1,
            title: 'Morning Silence',
            description: 'Start your day with peaceful silence and inner stillness',
            duration: '20 minutes',
            audioUrl: null,
            imageUrl: 'https://via.placeholder.com/300x200?text=Morning+Silence',
            createdAt: '2024-01-15'
          },
          {
            id: 2,
            title: 'Evening Contemplation',
            description: 'End your day with deep contemplative silence',
            duration: '30 minutes',
            audioUrl: null,
            imageUrl: 'https://via.placeholder.com/300x200?text=Evening+Silence',
            createdAt: '2024-01-14'
          }
        ];
      } catch (error) {
        console.error('Error loading silences:', error);
        toast.error('Failed to load silence sessions');
      } finally {
        loading.value = false;
      }
    };

    const handleFileUpload = (event, type) => {
      const file = event.target.files[0];
      if (file) {
        uploadForm.value[type] = file;
      }
    };

    const uploadSilence = async () => {
      try {
        if (!uploadForm.value.title || !uploadForm.value.description) {
          toast.warning('Please fill in all required fields');
          return;
        }

        loading.value = true;
        
        // API call would go here
        // const formData = new FormData();
        // formData.append('title', uploadForm.value.title);
        // formData.append('description', uploadForm.value.description);
        // formData.append('duration', uploadForm.value.duration);
        // if (uploadForm.value.audioFile) formData.append('audio', uploadForm.value.audioFile);
        // if (uploadForm.value.imageFile) formData.append('image', uploadForm.value.imageFile);
        // await api.uploadSilence(formData);

        toast.success('Silence session uploaded successfully!');
        showUploadModal.value = false;
        uploadForm.value = { title: '', description: '', duration: '', audioFile: null, imageFile: null };
        await loadSilences();
      } catch (error) {
        console.error('Error uploading silence:', error);
        toast.error('Failed to upload silence session');
      } finally {
        loading.value = false;
      }
    };

    const deleteSilence = async (id) => {
      try {
        if (!confirm('Are you sure you want to delete this silence session?')) return;
        
        loading.value = true;
        // await api.deleteSilence(id);
        
        toast.success('Silence session deleted successfully!');
        await loadSilences();
      } catch (error) {
        console.error('Error deleting silence:', error);
        toast.error('Failed to delete silence session');
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push('/client/activity');
    };

    onMounted(() => {
      loadSilences();
    });

    return () => (
      <div class="container-fluid px-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div>
                <button class="btn btn-outline-secondary btn-sm me-3" onClick={goBack}>
                  ← Back to Activities
                </button>
                <h1 class="h2 mb-0">🤫 Silence & Stillness</h1>
                <p class="text-muted mb-0">Deep silence meditation and contemplative practices</p>
              </div>
              <button 
                class="btn btn-primary"
                onClick={() => showUploadModal.value = true}
              >
                + Add Silence Session
              </button>
            </div>

            {/* Silence Sessions Grid */}
            <div class="row g-4">
              {silences.value.map(silence => (
                <div key={silence.id} class="col-lg-4 col-md-6">
                  <div class="card h-100 shadow-sm">
                    <img 
                      src={silence.imageUrl} 
                      class="card-img-top" 
                      alt={silence.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <div class="card-body">
                      <h5 class="card-title">{silence.title}</h5>
                      <p class="card-text text-muted">{silence.description}</p>
                      <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">Duration: {silence.duration}</small>
                        <div class="btn-group">
                          <button class="btn btn-sm btn-outline-primary">Play</button>
                          <button 
                            class="btn btn-sm btn-outline-danger"
                            onClick={() => deleteSilence(silence.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {silences.value.length === 0 && !loading.value && (
              <div class="text-center py-5">
                <div class="mb-4">
                  <i class="fas fa-volume-mute fa-4x text-muted"></i>
                </div>
                <h3>No Silence Sessions Yet</h3>
                <p class="text-muted">Start by adding your first silence meditation session</p>
                <button 
                  class="btn btn-primary"
                  onClick={() => showUploadModal.value = true}
                >
                  Add First Session
                </button>
              </div>
            )}

            {/* Loading */}
            {loading.value && (
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Add Silence Session</h5>
                  <button 
                    type="button" 
                    class="btn-close"
                    onClick={() => showUploadModal.value = false}
                  ></button>
                </div>
                <div class="modal-body">
                  <form>
                    <div class="mb-3">
                      <label class="form-label">Title *</label>
                      <input 
                        type="text" 
                        class="form-control"
                        v-model={uploadForm.value.title}
                        placeholder="Enter silence session title"
                      />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Description *</label>
                      <textarea 
                        class="form-control"
                        rows="3"
                        v-model={uploadForm.value.description}
                        placeholder="Describe this silence session"
                      ></textarea>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Duration</label>
                      <input 
                        type="text" 
                        class="form-control"
                        v-model={uploadForm.value.duration}
                        placeholder="e.g., 20 minutes"
                      />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Audio File</label>
                      <input 
                        type="file" 
                        class="form-control"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload(e, 'audioFile')}
                      />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Image</label>
                      <input 
                        type="file" 
                        class="form-control"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'imageFile')}
                      />
                    </div>
                  </form>
                </div>
                <div class="modal-footer">
                  <button 
                    type="button" 
                    class="btn btn-secondary"
                    onClick={() => showUploadModal.value = false}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-primary"
                    onClick={uploadSilence}
                    disabled={loading.value}
                  >
                    {loading.value ? 'Uploading...' : 'Upload Session'}
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