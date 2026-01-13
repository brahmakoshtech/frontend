import { ref } from 'vue';
import { useRouter } from 'vue-router';
<<<<<<< HEAD
import { ArrowLeftIcon, SparklesIcon, PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/vue/24/outline';
=======
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c

export default {
  name: 'ChantingActivity',
  setup() {
    const router = useRouter();
<<<<<<< HEAD
    const isPlaying = ref(false);
=======
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c

    const goBack = () => {
      router.push('/client/activity');
    };

<<<<<<< HEAD
    const togglePlay = () => {
      isPlaying.value = !isPlaying.value;
    };

    const mantras = [
      { name: 'Om Mani Padme Hum', meaning: 'Compassion and wisdom' },
      { name: 'Om Namah Shivaya', meaning: 'I bow to Shiva' },
      { name: 'Gayatri Mantra', meaning: 'Divine illumination' },
      { name: 'So Hum', meaning: 'I am that' }
    ];

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3" 
                  onClick={goBack}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                  Back
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2">
                    <SparklesIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Chanting
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Sacred mantras and spiritual chanting</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Main Content */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h3 class="fw-bold mb-3">Sacred Mantra Chanting</h3>
                    <p class="text-muted mb-4">Connect with divine energy through the power of sacred mantras. Let the vibrations heal and transform your being.</p>
                    
                    {/* Player */}
                    <div class="text-center p-4 bg-light rounded-4 mb-4">
                      <div class="mb-3">
                        <button 
                          class="btn btn-lg rounded-circle shadow-sm"
                          style={{ 
                            width: '80px', 
                            height: '80px',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none'
                          }}
                          onClick={togglePlay}
                        >
                          {isPlaying.value ? 
                            <PauseIcon style={{ width: '2rem', height: '2rem' }} /> :
                            <PlayIcon style={{ width: '2rem', height: '2rem' }} />
                          }
                        </button>
                      </div>
                      <p class="mb-0 fw-semibold">Om Mani Padme Hum</p>
                      <small class="text-muted">Currently Playing</small>
                    </div>

                    {/* Mantras List */}
                    <div class="mb-4">
                      <h5 class="fw-bold mb-3">Available Mantras:</h5>
                      <div class="list-group">
                        {mantras.map((mantra, index) => (
                          <div key={index} class="list-group-item border-0 bg-light rounded-3 mb-2 p-3">
                            <div class="d-flex align-items-center justify-content-between">
                              <div>
                                <h6 class="mb-1 fw-semibold">{mantra.name}</h6>
                                <small class="text-muted">{mantra.meaning}</small>
                              </div>
                              <button class="btn btn-sm btn-outline-warning rounded-pill">
                                <PlayIcon style={{ width: '1rem', height: '1rem' }} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🕉️ Spiritual Connection</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🎵 Voice Healing</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">⚡ Energy Flow</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🧘 Deep Focus</span>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">How to Chant</h5>
                    <ol class="list-unstyled">
                      <li class="mb-2">1. Sit comfortably with spine straight</li>
                      <li class="mb-2">2. Take deep breaths to center yourself</li>
                      <li class="mb-2">3. Chant slowly and clearly</li>
                      <li class="mb-2">4. Feel the vibrations in your body</li>
                      <li class="mb-0">5. Continue with devotion</li>
                    </ol>
                  </div>
                </div>
=======
    return () => (
      <div class="container-fluid px-4">
        <div class="row">
          <div class="col-12">
            <div class="d-flex align-items-center gap-3 mb-4">
              <button 
                class="btn btn-outline-secondary btn-sm rounded-pill px-3" 
                onClick={goBack}
              >
                <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                Back
              </button>
              <div>
                <h1 class="mb-0 fw-bold">🎵 Chanting</h1>
                <p class="text-muted mb-0">Sacred mantras and spiritual chanting</p>
              </div>
            </div>
            <div class="card border-0 shadow-sm rounded-4">
              <div class="card-body p-5 text-center">
                <div class="display-1 mb-3">🎵</div>
                <h3 class="fw-bold mb-3">Chanting Practice</h3>
                <p class="text-muted">Coming soon - Sacred mantra chanting experience</p>
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};