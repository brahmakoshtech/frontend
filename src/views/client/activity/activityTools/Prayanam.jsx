import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, UserIcon, PlayIcon, PauseIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'PrayanamActivity',
  setup() {
    const router = useRouter();
    const isActive = ref(false);
    const currentRound = ref(0);
    const totalRounds = ref(10);

    const goBack = () => {
      router.push('/client/activity');
    };

    const startPranayama = () => {
      isActive.value = !isActive.value;
      if (isActive.value) {
        currentRound.value = 1;
      }
    };

    const techniques = [
      { name: 'Anulom Vilom', description: 'Alternate nostril breathing', duration: '10 min' },
      { name: 'Bhramari', description: 'Humming bee breath', duration: '8 min' },
      { name: 'Ujjayi', description: 'Ocean breath', duration: '12 min' },
      { name: 'Kapalabhati', description: 'Skull shining breath', duration: '5 min' }
    ];

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
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
                    <UserIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Prayanam
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Breathing exercises and pranayama</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Breathing Exercise */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h3 class="fw-bold mb-3">Guided Breathing Exercise</h3>
                    
                    {/* Breathing Circle */}
                    <div class="text-center p-4 mb-4">
                      <div 
                        class="rounded-circle mx-auto d-flex align-items-center justify-content-center shadow-lg"
                        style={{ 
                          width: '200px', 
                          height: '200px',
                          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                          transform: isActive.value ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 4s ease-in-out'
                        }}
                      >
                        <div class="text-white text-center">
                          <div class="fs-4 fw-bold">{isActive.value ? 'Breathe' : 'Ready'}</div>
                          <div class="small">Round {currentRound.value}/{totalRounds.value}</div>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div class="text-center mb-4">
                      <button 
                        class="btn btn-lg rounded-pill px-4"
                        style={{ 
                          backgroundColor: '#06b6d4',
                          color: 'white',
                          border: 'none'
                        }}
                        onClick={startPranayama}
                      >
                        {isActive.value ? 
                          <><PauseIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />Stop</> :
                          <><PlayIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />Start</>
                        }
                      </button>
                    </div>

                    {/* Instructions */}
                    <div class="bg-light rounded-4 p-4">
                      <h5 class="fw-bold mb-3">Breathing Pattern:</h5>
                      <div class="row text-center">
                        <div class="col-4">
                          <div class="fw-bold text-primary">4 sec</div>
                          <small>Inhale</small>
                        </div>
                        <div class="col-4">
                          <div class="fw-bold text-warning">4 sec</div>
                          <small>Hold</small>
                        </div>
                        <div class="col-4">
                          <div class="fw-bold text-success">4 sec</div>
                          <small>Exhale</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Techniques */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">Pranayama Techniques</h4>
                    <div class="row g-3">
                      {techniques.map((technique, index) => (
                        <div key={index} class="col-md-6">
                          <div class="card border-0 bg-light rounded-3">
                            <div class="card-body p-3">
                              <h6 class="fw-bold mb-1">{technique.name}</h6>
                              <p class="text-muted small mb-2">{technique.description}</p>
                              <small class="text-primary">{technique.duration}</small>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🫁 Breath Control</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">⚡ Energy Balance</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">💪 Vitality</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🧘 Focus</span>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Practice Tips</h5>
                    <ul class="list-unstyled">
                      <li class="mb-2">🌅 Practice on empty stomach</li>
                      <li class="mb-2">🪑 Sit with straight spine</li>
                      <li class="mb-2">👃 Breathe through nose</li>
                      <li class="mb-2">🐌 Start slowly and gradually</li>
                      <li class="mb-0">🛑 Stop if you feel dizzy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};