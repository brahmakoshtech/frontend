import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, PlayIcon, PauseIcon, ClockIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'MeditationActivity',
  setup() {
    const router = useRouter();
    const isPlaying = ref(false);
    const currentTime = ref(0);
    const selectedDuration = ref(5); // minutes
    const sessionStarted = ref(false);
    let timer = null;

    const durations = [
      { value: 5, label: '5 min' },
      { value: 10, label: '10 min' },
      { value: 15, label: '15 min' },
      { value: 30, label: '30 min' }
    ];

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
          </div>
        </div>
      </div>
    );
  }
};