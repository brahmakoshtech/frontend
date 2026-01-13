import { ref } from 'vue';
import { useRouter } from 'vue-router';
<<<<<<< HEAD
import { ArrowLeftIcon, UserIcon, PlayIcon, ClockIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'YogaActivity',
  setup() {
    const router = useRouter();
    const selectedPose = ref(null);
    const currentSession = ref(null);

    const goBack = () => {
      router.push('/client/activity');
    };

    const startSession = (session) => {
      currentSession.value = session;
    };

    const yogaSessions = [
      {
        id: 1,
        name: 'Morning Flow',
        duration: '30 min',
        level: 'Beginner',
        poses: 12,
        description: 'Gentle morning sequence to energize your day',
        color: '#14b8a6'
      },
      {
        id: 2,
        name: 'Sun Salutation',
        duration: '20 min',
        level: 'Intermediate',
        poses: 8,
        description: 'Classic Surya Namaskara sequence',
        color: '#f59e0b'
      },
      {
        id: 3,
        name: 'Evening Relaxation',
        duration: '45 min',
        level: 'All Levels',
        poses: 15,
        description: 'Calming poses for peaceful sleep',
        color: '#8b5cf6'
      },
      {
        id: 4,
        name: 'Power Yoga',
        duration: '60 min',
        level: 'Advanced',
        poses: 20,
        description: 'Dynamic flow for strength and flexibility',
        color: '#ef4444'
      }
    ];

    const basicPoses = [
      { name: 'Mountain Pose', sanskrit: 'Tadasana', benefit: 'Grounding & Posture' },
      { name: 'Downward Dog', sanskrit: 'Adho Mukha Svanasana', benefit: 'Full Body Stretch' },
      { name: 'Warrior I', sanskrit: 'Virabhadrasana I', benefit: 'Strength & Focus' },
      { name: 'Child\'s Pose', sanskrit: 'Balasana', benefit: 'Rest & Relaxation' },
      { name: 'Tree Pose', sanskrit: 'Vrikshasana', benefit: 'Balance & Stability' },
      { name: 'Cobra Pose', sanskrit: 'Bhujangasana', benefit: 'Back Flexibility' }
    ];

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }}>
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
                    Yoga
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Physical and spiritual yoga practices</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Current Session */}
                {currentSession.value && (
                  <div class="card border-0 shadow-sm rounded-4 mb-4">
                    <div class="card-body p-4">
                      <h4 class="fw-bold mb-3">Current Session: {currentSession.value.name}</h4>
                      <div class="row align-items-center">
                        <div class="col-md-8">
                          <p class="text-muted mb-3">{currentSession.value.description}</p>
                          <div class="d-flex gap-3 mb-3">
                            <span class="badge bg-light text-dark px-3 py-2 rounded-pill">
                              <ClockIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                              {currentSession.value.duration}
                            </span>
                            <span class="badge bg-light text-dark px-3 py-2 rounded-pill">
                              📊 {currentSession.value.level}
                            </span>
                            <span class="badge bg-light text-dark px-3 py-2 rounded-pill">
                              🧘 {currentSession.value.poses} poses
                            </span>
                          </div>
                        </div>
                        <div class="col-md-4 text-center">
                          <div 
                            class="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                            style={{ 
                              width: '100px', 
                              height: '100px',
                              backgroundColor: currentSession.value.color,
                              color: 'white'
                            }}
                          >
                            <UserIcon style={{ width: '2.5rem', height: '2.5rem' }} />
                          </div>
                          <button class="btn btn-success rounded-pill px-4">
                            <PlayIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />
                            Continue
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Yoga Sessions */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">Yoga Sessions</h4>
                    <div class="row g-3">
                      {yogaSessions.map(session => (
                        <div key={session.id} class="col-md-6">
                          <div class="card border-0 bg-light rounded-4 h-100">
                            <div class="card-body p-3">
                              <div class="d-flex align-items-center mb-3">
                                <div 
                                  class="rounded-circle me-3 d-flex align-items-center justify-content-center"
                                  style={{ 
                                    width: '50px', 
                                    height: '50px',
                                    backgroundColor: session.color,
                                    color: 'white'
                                  }}
                                >
                                  <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                                </div>
                                <div class="flex-grow-1">
                                  <h6 class="fw-bold mb-1">{session.name}</h6>
                                  <small class="text-muted">{session.level}</small>
                                </div>
                              </div>
                              <p class="text-muted small mb-3">{session.description}</p>
                              <div class="d-flex justify-content-between align-items-center">
                                <div class="d-flex gap-2">
                                  <small class="text-muted">{session.duration}</small>
                                  <small class="text-muted">• {session.poses} poses</small>
                                </div>
                                <button 
                                  class="btn btn-sm rounded-pill px-3"
                                  style={{ 
                                    backgroundColor: session.color,
                                    color: 'white',
                                    border: 'none'
                                  }}
                                  onClick={() => startSession(session)}
                                >
                                  Start
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Basic Poses */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">Basic Yoga Poses</h4>
                    <div class="row g-3">
                      {basicPoses.map((pose, index) => (
                        <div key={index} class="col-md-6">
                          <div class="p-3 bg-light rounded-3">
                            <h6 class="fw-bold mb-1">{pose.name}</h6>
                            <p class="text-muted small mb-1 fst-italic">{pose.sanskrit}</p>
                            <small class="text-success">{pose.benefit}</small>
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
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🤸 Flexibility</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">💪 Strength</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🧘 Mind-Body Unity</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">⚖️ Balance</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Your Progress</h5>
                    <div class="mb-3">
                      <div class="d-flex justify-content-between mb-1">
                        <small>Sessions Completed</small>
                        <small>12/20</small>
                      </div>
                      <div class="progress" style={{ height: '8px' }}>
                        <div class="progress-bar bg-success" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div class="mb-3">
                      <div class="d-flex justify-content-between mb-1">
                        <small>Flexibility Score</small>
                        <small>75%</small>
                      </div>
                      <div class="progress" style={{ height: '8px' }}>
                        <div class="progress-bar bg-info" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Yoga Tips</h5>
                    <ul class="list-unstyled">
                      <li class="mb-2">🌅 Practice on empty stomach</li>
                      <li class="mb-2">🧘 Focus on your breath</li>
                      <li class="mb-2">🐌 Move slowly and mindfully</li>
                      <li class="mb-2">👂 Listen to your body</li>
                      <li class="mb-0">🔄 Practice regularly</li>
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
=======
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const createActivity = (name, icon, title) => ({
  name,
  setup() {
    const router = useRouter();
    const goBack = () => router.push('/client/activity');
    return () => (
      <div class="container-fluid px-4">
        <div class="row"><div class="col-12">
        <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={goBack}>
        <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />Back</button>
        <div><h1 class="mb-0 fw-bold">{icon} {title}</h1><p class="text-muted mb-0">Practice</p></div></div>
        <div class="card border-0 shadow-sm rounded-4"><div class="card-body p-5 text-center">
        <div class="display-1 mb-3">{icon}</div><h3 class="fw-bold mb-3">{title}</h3>
        <p class="text-muted">Coming soon</p></div></div></div></div></div>
    );
  }
});

export default createActivity('YogaActivity', '🧘', 'Yoga');
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
