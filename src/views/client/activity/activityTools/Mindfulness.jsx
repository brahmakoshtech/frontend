import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, EyeIcon, PlayIcon, PauseIcon, BellIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'MindfulnessActivity',
  setup() {
    const router = useRouter();
    const isActive = ref(false);
    const currentExercise = ref(null);
    const timer = ref(0);

    const goBack = () => {
      router.push('/client/activity');
    };

    const startExercise = (exercise) => {
      currentExercise.value = exercise;
      isActive.value = true;
      timer.value = exercise.duration * 60; // Convert to seconds
    };

    const toggleTimer = () => {
      isActive.value = !isActive.value;
    };

    const exercises = [
      {
        id: 1,
        name: 'Body Scan',
        duration: 10,
        description: 'Systematic awareness of body sensations from head to toe',
        instructions: [
          'Lie down comfortably',
          'Close your eyes gently',
          'Start from the top of your head',
          'Slowly scan down through your body',
          'Notice any sensations without judgment'
        ]
      },
      {
        id: 2,
        name: '5-4-3-2-1 Grounding',
        duration: 5,
        description: 'Use your senses to anchor yourself in the present moment',
        instructions: [
          'Notice 5 things you can see',
          'Notice 4 things you can touch',
          'Notice 3 things you can hear',
          'Notice 2 things you can smell',
          'Notice 1 thing you can taste'
        ]
      },
      {
        id: 3,
        name: 'Mindful Walking',
        duration: 15,
        description: 'Walking meditation with full awareness of each step',
        instructions: [
          'Walk very slowly',
          'Feel your feet touching the ground',
          'Notice the movement of your legs',
          'Be aware of your surroundings',
          'Return attention when mind wanders'
        ]
      },
      {
        id: 4,
        name: 'Loving Kindness',
        duration: 12,
        description: 'Cultivate compassion for yourself and others',
        instructions: [
          'Start with yourself: "May I be happy"',
          'Extend to loved ones',
          'Include neutral people',
          'Embrace difficult relationships',
          'Expand to all beings'
        ]
      }
    ];

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
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
                    <EyeIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Mindfulness
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Present moment awareness and mindfulness</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Current Exercise */}
                {currentExercise.value && (
                  <div class="card border-0 shadow-sm rounded-4 mb-4">
                    <div class="card-body p-4">
                      <h4 class="fw-bold mb-3 text-primary">{currentExercise.value.name}</h4>
                      
                      {/* Timer */}
                      <div class="text-center p-4 mb-4">
                        <div 
                          class="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center shadow-lg"
                          style={{ 
                            width: '150px', 
                            height: '150px',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white'
                          }}
                        >
                          <div class="text-center">
                            <div class="fs-3 fw-bold">{formatTime(timer.value)}</div>
                            <small>remaining</small>
                          </div>
                        </div>
                        <button 
                          class="btn btn-primary btn-lg rounded-pill px-4"
                          onClick={toggleTimer}
                        >
                          {isActive.value ? 
                            <><PauseIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />Pause</> :
                            <><PlayIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />Resume</>
                          }
                        </button>
                      </div>

                      {/* Instructions */}
                      <div class="bg-light rounded-4 p-4">
                        <h6 class="fw-bold mb-3">Instructions:</h6>
                        <ol class="mb-0">
                          {currentExercise.value.instructions.map((instruction, index) => (
                            <li key={index} class="mb-2">{instruction}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mindfulness Exercises */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">Mindfulness Exercises</h4>
                    <div class="row g-3">
                      {exercises.map(exercise => (
                        <div key={exercise.id} class="col-md-6">
                          <div class="card border-0 bg-light rounded-4 h-100">
                            <div class="card-body p-3">
                              <div class="d-flex align-items-center justify-content-between mb-2">
                                <h6 class="fw-bold mb-0">{exercise.name}</h6>
                                <span class="badge bg-primary px-2 py-1 rounded-pill">
                                  {exercise.duration} min
                                </span>
                              </div>
                              <p class="text-muted small mb-3">{exercise.description}</p>
                              <button 
                                class="btn btn-primary btn-sm rounded-pill px-3 w-100"
                                onClick={() => startExercise(exercise)}
                              >
                                <PlayIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                                Start Exercise
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                {/* Daily Reminder */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Mindful Moment</h5>
                    <div class="p-3 bg-primary-subtle rounded-4 text-center">
                      <BellIcon style={{ width: '2rem', height: '2rem' }} class="text-primary mb-2" />
                      <p class="mb-0 fst-italic">
                        "The present moment is the only moment available to us, and it is the door to all moments."
                      </p>
                      <small class="text-muted">- Thich Nhat Hanh</small>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">👁️ Present Awareness</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🧠 Clarity</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">☮️ Peace</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🎯 Focus</span>
                    </div>
                  </div>
                </div>

                {/* Quick Tips */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Mindfulness Tips</h5>
                    <ul class="list-unstyled">
                      <li class="mb-2">🌬️ Start with your breath</li>
                      <li class="mb-2">🏃 No need to rush</li>
                      <li class="mb-2">🤗 Be kind to yourself</li>
                      <li class="mb-2">🔄 Practice little and often</li>
                      <li class="mb-0">🎯 Notice without judging</li>
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