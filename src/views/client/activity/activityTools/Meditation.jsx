import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
<<<<<<< HEAD
import { ArrowLeftIcon, PlayIcon, PauseIcon, ClockIcon, EyeIcon, XMarkIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/vue/24/outline';
import meditationService from '../../../../services/meditationService';
=======
import { ArrowLeftIcon, PlayIcon, PauseIcon, ClockIcon } from '@heroicons/vue/24/outline';
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c

export default {
  name: 'MeditationActivity',
  setup() {
    const router = useRouter();
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const selectedDuration = ref(5); // minutes
    const sessionStarted = ref(false);
<<<<<<< HEAD
    const showModal = ref(false);
    const showAddModal = ref(false);
    const selectedMeditation = ref(null);
    const meditations = ref([]);
    const loading = ref(false);
    const formData = ref({
      name: '',
      description: '',
      video: null,
      link: '',
      image: null
    });
=======
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
    let timer = null;

    const durations = [
      { value: 5, label: '5 min' },
      { value: 10, label: '10 min' },
      { value: 15, label: '15 min' },
      { value: 30, label: '30 min' }
    ];

<<<<<<< HEAD
    const meditationTypes = [];

    // Load meditations from API
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
    [
      {
        
        id: 1,
        name: 'Mindfulness Meditation',
        description: 'Focus on the present moment and observe your thoughts without judgment.',
        benefits: ['Reduces stress', 'Improves focus', 'Enhances emotional regulation'],
        duration: '10-30 minutes',
        difficulty: 'Beginner',
        instructions: 'Sit comfortably, close your eyes, and focus on your breath. When thoughts arise, acknowledge them and gently return to your breathing.'
      },
      {
        id: 2,
        name: 'Loving-Kindness Meditation',
        description: 'Cultivate compassion and love for yourself and others.',
        benefits: ['Increases empathy', 'Reduces negative emotions', 'Improves relationships'],
        duration: '15-25 minutes',
        difficulty: 'Intermediate',
        instructions: 'Begin by sending loving thoughts to yourself, then extend these feelings to loved ones, neutral people, and even difficult people.'
      },
      {
        id: 3,
        name: 'Body Scan Meditation',
        description: 'Systematically focus on different parts of your body to release tension.',
        benefits: ['Reduces physical tension', 'Improves body awareness', 'Promotes relaxation'],
        duration: '20-45 minutes',
        difficulty: 'Beginner',
        instructions: 'Lie down comfortably and slowly move your attention through each part of your body, from toes to head, noticing sensations without trying to change them.'
      },
      {
        id: 4,
        name: 'Transcendental Meditation',
        description: 'Use a personal mantra to transcend ordinary thinking and reach deep rest.',
        benefits: ['Deep relaxation', 'Reduces anxiety', 'Improves creativity'],
        duration: '20 minutes',
        difficulty: 'Advanced',
        instructions: 'Sit with eyes closed and silently repeat your personal mantra. Allow thoughts to come and go naturally without forcing concentration.'
      }
    ];

=======
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
    const goBack = () => {
      if (timer) clearInterval(timer);
      router.push('/client/activity');
    };

    const startMeditation = () => {
      sessionStarted.value = true;
      isPlaying.value = true;
      currentTime.value = selectedDuration.value * 60; // convert to seconds
      
      timer = setInterval(() => {
        if (currentTime.value > 0) {
          currentTime.value--;
        } else {
          completeMeditation();
        }
      }, 1000);
    };

    const pauseMeditation = () => {
      isPlaying.value = false;
      if (timer) clearInterval(timer);
    };

    const resumeMeditation = () => {
      isPlaying.value = true;
      timer = setInterval(() => {
        if (currentTime.value > 0) {
          currentTime.value--;
        } else {
          completeMeditation();
        }
      }, 1000);
    };

    const completeMeditation = () => {
      isPlaying.value = false;
      sessionStarted.value = false;
      currentTime.value = 0;
      if (timer) clearInterval(timer);
      alert('🎉 Meditation Complete! Well done!');
    };

    const resetMeditation = () => {
      isPlaying.value = false;
      sessionStarted.value = false;
      currentTime.value = 0;
      if (timer) clearInterval(timer);
    };

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

<<<<<<< HEAD
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
    };

    const closeAddModal = () => {
      showAddModal.value = false;
    };

    const handleVideoUpload = (event) => {
      formData.value.video = event.target.files[0];
    };

    const handleImageUpload = (event) => {
      formData.value.image = event.target.files[0];
    };

    const submitForm = async () => {
      try {
        loading.value = true;
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.value.name);
        formDataToSend.append('description', formData.value.description);
        formDataToSend.append('link', formData.value.link);
        
        if (formData.value.video) {
          formDataToSend.append('video', formData.value.video);
        }
        if (formData.value.image) {
          formDataToSend.append('image', formData.value.image);
        }

        await meditationService.create(formDataToSend);
        await loadMeditations();
        closeAddModal();
        alert('Meditation added successfully!');
      } catch (error) {
        console.error('Error creating meditation:', error);
        alert('Error creating meditation');
      } finally {
        loading.value = false;
      }
    };

    const deleteMeditation = async (id) => {
      if (confirm('Are you sure you want to delete this meditation?')) {
        try {
          loading.value = true;
          await meditationService.delete(id);
          await loadMeditations();
          alert('Meditation deleted successfully!');
        } catch (error) {
          console.error('Error deleting meditation:', error);
          alert('Error deleting meditation');
        } finally {
          loading.value = false;
        }
      }
    };

    onMounted(() => {
      loadMeditations();
    });

=======
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
    onUnmounted(() => {
      if (timer) clearInterval(timer);
    });

    return () => (
      <div class="container-fluid px-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="d-flex align-items-center justify-content-between mb-4">
              <div class="d-flex align-items-center gap-3">
                <button 
                  class="btn btn-outline-secondary btn-sm rounded-pill px-3" 
                  onClick={goBack}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                  Back
                </button>
                <div>
                  <h1 class="mb-0 fw-bold">🧘♀️ Meditation</h1>
                  <p class="text-muted mb-0">Find your inner peace</p>
                </div>
              </div>
<<<<<<< HEAD
              <button 
                class="btn btn-primary rounded-pill px-4"
                onClick={openAddModal}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} class="me-2" />
                Add Meditation
              </button>
=======
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
            </div>

            <div class="row g-4">
              {/* Main Content */}
              <div class="col-lg-8">
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-5 text-center">
                    
                    {!sessionStarted.value ? (
                      // Before Starting
                      <div>
                        <div class="mb-4">
                          <div class="display-1 mb-3">🧘♀️</div>
                          <h3 class="fw-bold mb-3">Ready to Meditate?</h3>
                          <p class="text-muted">Choose your meditation duration and begin your journey to inner peace.</p>
                        </div>

                        {/* Duration Selection */}
                        <div class="mb-4">
                          <h5 class="fw-semibold mb-3">Select Duration</h5>
                          <div class="d-flex justify-content-center gap-2 flex-wrap">
                            {durations.map(duration => (
                              <button
                                key={duration.value}
                                class={`btn rounded-pill px-4 ${selectedDuration.value === duration.value ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => selectedDuration.value = duration.value}
                              >
                                {duration.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Start Button */}
                        <button 
                          class="btn btn-primary btn-lg rounded-pill px-5"
                          onClick={startMeditation}
                        >
                          <PlayIcon style={{ width: '1.5rem', height: '1.5rem' }} class="me-2" />
                          Start {selectedDuration.value} Minute Meditation
                        </button>
                      </div>
                    ) : (
                      // During Meditation
                      <div>
                        {/* Timer Display */}
                        <div class="mb-4">
                          <div class="display-1 fw-bold text-primary mb-3">
                            {formatTime(currentTime.value)}
                          </div>
                          <div class="progress mx-auto mb-3" style={{ height: '8px', maxWidth: '400px' }}>
                            <div 
                              class="progress-bar bg-primary" 
                              style={{ 
                                width: `${((selectedDuration.value * 60 - currentTime.value) / (selectedDuration.value * 60)) * 100}%`
                              }}
                            ></div>
                          </div>
                          <p class="text-muted">
                            {isPlaying.value ? 'Meditation in progress...' : 'Meditation paused'}
                          </p>
                        </div>

                        {/* Control Buttons */}
                        <div class="d-flex justify-content-center gap-3">
                          {isPlaying.value ? (
                            <button 
                              class="btn btn-warning btn-lg rounded-circle"
                              style={{ width: '60px', height: '60px' }}
                              onClick={pauseMeditation}
                            >
                              <PauseIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                            </button>
                          ) : (
                            <button 
                              class="btn btn-success btn-lg rounded-circle"
                              style={{ width: '60px', height: '60px' }}
                              onClick={resumeMeditation}
                            >
                              <PlayIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                            </button>
                          )}
                          <button 
                            class="btn btn-outline-secondary btn-lg rounded-pill px-4"
                            onClick={resetMeditation}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div class="col-lg-4">
                {/* Instructions */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">How to Meditate</h5>
                    <div class="d-flex flex-column gap-3">
                      <div class="d-flex align-items-start gap-3">
                        <span class="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                        <div>
                          <strong>Sit Comfortably</strong>
                          <p class="text-muted mb-0 small">Find a quiet place and sit with your back straight</p>
                        </div>
                      </div>
                      <div class="d-flex align-items-start gap-3">
                        <span class="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                        <div>
                          <strong>Close Your Eyes</strong>
                          <p class="text-muted mb-0 small">Gently close your eyes and relax your body</p>
                        </div>
                      </div>
                      <div class="d-flex align-items-start gap-3">
                        <span class="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                        <div>
                          <strong>Focus on Breathing</strong>
                          <p class="text-muted mb-0 small">Pay attention to your natural breath</p>
                        </div>
                      </div>
                      <div class="d-flex align-items-start gap-3">
                        <span class="badge bg-primary rounded-circle" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
                        <div>
                          <strong>Stay Present</strong>
                          <p class="text-muted mb-0 small">When your mind wanders, gently return to your breath</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

<<<<<<< HEAD
                {/* Meditation Types */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">My Meditations</h5>
                    {loading.value ? (
                      <div class="text-center py-3">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : meditations.value.length > 0 ? (
                      <div class="d-flex flex-column gap-3">
                        {meditations.value.map(meditation => (
                          <div key={meditation._id} class="border rounded-3 p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="fw-semibold mb-1">{meditation.name}</h6>
                              <div class="d-flex gap-2">
                                <button 
                                  class="btn btn-outline-primary btn-sm"
                                  onClick={() => openModal(meditation)}
                                >
                                  <EyeIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                                  View
                                </button>
                                <button 
                                  class="btn btn-outline-danger btn-sm"
                                  onClick={() => deleteMeditation(meditation._id)}
                                >
                                  <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                </button>
                              </div>
                            </div>
                            <p class="text-muted small mb-2">{meditation.description}</p>
                            {meditation.link && (
                              <a href={meditation.link} target="_blank" class="badge bg-info text-decoration-none me-2">Link</a>
                            )}
                            {meditation.videoUrl && (
                              <span class="badge bg-success me-2">Video</span>
                            )}
                            {meditation.imageUrl && (
                              <span class="badge bg-warning">Image</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p class="text-muted text-center py-3">No meditations found. Add your first meditation!</p>
                    )}
                  </div>
                </div>

=======
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <div class="d-flex align-items-center gap-2">
                        <span>🧠</span>
                        <span>Reduces stress and anxiety</span>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <span>💤</span>
                        <span>Improves sleep quality</span>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <span>🎯</span>
                        <span>Enhances focus and concentration</span>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <span>❤️</span>
                        <span>Promotes emotional well-being</span>
                      </div>
                      <div class="d-flex align-items-center gap-2">
                        <span>🌟</span>
                        <span>Increases self-awareness</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
<<<<<<< HEAD

            {/* View Modal */}
            {showModal.value && selectedMeditation.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg modal-dialog-centered">
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-0">
                      <h5 class="modal-title fw-bold">{selectedMeditation.value.name}</h5>
                      <button 
                        type="button" 
                        class="btn-close" 
                        onClick={closeModal}
                      ></button>
                    </div>
                    <div class="modal-body pt-2">
                      <div class="mb-4">
                        <h6 class="fw-semibold mb-2">Description</h6>
                        <p class="text-muted">{selectedMeditation.value.description}</p>
                      </div>
                      
                      {selectedMeditation.value.link && (
                        <div class="mb-4">
                          <h6 class="fw-semibold mb-2">Link</h6>
                          <a href={selectedMeditation.value.link} target="_blank" class="btn btn-outline-primary btn-sm">
                            Open Link
                          </a>
                        </div>
                      )}
                      
                      {selectedMeditation.value.videoUrl && (
                        <div class="mb-4">
                          <h6 class="fw-semibold mb-2">Video</h6>
                          <video controls class="w-100 rounded-3" style={{ maxHeight: '300px' }}>
                            <source src={selectedMeditation.value.videoUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      
                      {selectedMeditation.value.imageUrl && (
                        <div class="mb-4">
                          <h6 class="fw-semibold mb-2">Image</h6>
                          <img src={selectedMeditation.value.imageUrl} alt={selectedMeditation.value.name} class="img-fluid rounded-3" />
                        </div>
                      )}
                    </div>
                    <div class="modal-footer border-0 pt-0">
                      <button 
                        type="button" 
                        class="btn btn-secondary rounded-pill px-4" 
                        onClick={closeModal}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg modal-dialog-centered">
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-0">
                      <h5 class="modal-title fw-bold">Add New Meditation</h5>
                      <button 
                        type="button" 
                        class="btn-close" 
                        onClick={closeAddModal}
                      ></button>
                    </div>
                    <div class="modal-body pt-2">
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Name</label>
                          <input 
                            type="text" 
                            class="form-control rounded-3" 
                            v-model={formData.value.name}
                            placeholder="Enter meditation name"
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Description</label>
                          <textarea 
                            class="form-control rounded-3" 
                            rows="3"
                            v-model={formData.value.description}
                            placeholder="Enter meditation description"
                          ></textarea>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Upload Video</label>
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            accept="video/*"
                            onChange={handleVideoUpload}
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Link</label>
                          <input 
                            type="url" 
                            class="form-control rounded-3" 
                            v-model={formData.value.link}
                            placeholder="Enter meditation link"
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Image</label>
                          <input 
                            type="file" 
                            class="form-control rounded-3" 
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                      <button 
                        type="button" 
                        class="btn btn-secondary rounded-pill px-4 me-2" 
                        onClick={closeAddModal}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-4" 
                        onClick={submitForm}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Adding...' : 'Add Meditation'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
=======
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
          </div>
        </div>
      </div>
    );
  }
};