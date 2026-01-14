import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, HeartIcon, PlusIcon, CheckIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'GratitudeActivity',
  setup() {
    const router = useRouter();
    const newGratitude = ref('');
    const gratitudeList = ref([
      'My family\'s love and support',
      'Good health and vitality',
      'A comfortable home',
      'Opportunities to learn and grow',
      'Beautiful moments in nature'
    ]);

    const goBack = () => {
      router.push('/client/activity');
    };

    const addGratitude = () => {
      if (newGratitude.value.trim()) {
        gratitudeList.value.unshift(newGratitude.value.trim());
        newGratitude.value = '';
      }
    };

    const prompts = [
      'What made you smile today?',
      'Who are you grateful for and why?',
      'What challenge helped you grow?',
      'What simple pleasure did you enjoy?',
      'What opportunity are you thankful for?',
      'What about your body are you grateful for?',
      'What skill or talent do you appreciate having?',
      'What memory brings you joy?'
    ];

    const affirmations = [
      'I am grateful for all the abundance in my life',
      'Every day brings new reasons to be thankful',
      'I appreciate the beauty that surrounds me',
      'Gratitude fills my heart with joy and peace',
      'I am blessed with love, health, and happiness'
    ];

    const getRandomPrompt = () => {
      return prompts[Math.floor(Math.random() * prompts.length)];
    };

    const getRandomAffirmation = () => {
      return affirmations[Math.floor(Math.random() * affirmations.length)];
    };

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
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
                    <HeartIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Gratitude
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Gratitude practices and appreciation</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Add New Gratitude */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">What are you grateful for today?</h4>
                    <div class="input-group mb-3">
                      <input 
                        type="text" 
                        class="form-control form-control-lg rounded-start-4" 
                        placeholder="I am grateful for..."
                        v-model={newGratitude.value}
                        onKeypress={(e) => e.key === 'Enter' && addGratitude()}
                      />
                      <button 
                        class="btn btn-warning rounded-end-4 px-4"
                        onClick={addGratitude}
                      >
                        <PlusIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      </button>
                    </div>
                    <div class="p-3 bg-warning-subtle rounded-4">
                      <p class="mb-0 fw-semibold text-warning-emphasis">
                        💡 Prompt: {getRandomPrompt()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gratitude List */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">My Gratitude Journal</h4>
                    <div class="list-group list-group-flush">
                      {gratitudeList.value.map((item, index) => (
                        <div key={index} class="list-group-item border-0 p-3 rounded-3 mb-2 bg-light">
                          <div class="d-flex align-items-center gap-3">
                            <div 
                              class="rounded-circle d-flex align-items-center justify-content-center"
                              style={{ 
                                width: '40px', 
                                height: '40px',
                                backgroundColor: '#f97316',
                                color: 'white'
                              }}
                            >
                              <CheckIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                            </div>
                            <div class="flex-grow-1">
                              <p class="mb-0 fw-medium">{item}</p>
                              <small class="text-muted">Added {index === 0 ? 'just now' : `${index} ${index === 1 ? 'day' : 'days'} ago`}</small>
                            </div>
                            <HeartIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f97316' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                {/* Daily Affirmation */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Daily Affirmation</h5>
                    <div class="p-4 bg-warning-subtle rounded-4 text-center">
                      <HeartIcon style={{ width: '2.5rem', height: '2.5rem' }} class="text-warning mb-3" />
                      <p class="mb-0 fst-italic fw-medium">
                        "{getRandomAffirmation()}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🙏 Thankfulness</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">😊 Positivity</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">😄 Joy</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">💖 Contentment</span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Your Progress</h5>
                    <div class="row text-center">
                      <div class="col-6">
                        <div class="p-3 bg-light rounded-3">
                          <div class="fs-4 fw-bold text-warning">{gratitudeList.value.length}</div>
                          <small class="text-muted">Total Entries</small>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 bg-light rounded-3">
                          <div class="fs-4 fw-bold text-warning">7</div>
                          <small class="text-muted">Day Streak</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practice Tips */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Gratitude Tips</h5>
                    <ul class="list-unstyled">
                      <li class="mb-2">🌅 Practice daily, preferably morning</li>
                      <li class="mb-2">📝 Write down 3-5 things daily</li>
                      <li class="mb-2">🔍 Be specific and detailed</li>
                      <li class="mb-2">💭 Feel the emotion, not just think</li>
                      <li class="mb-0">🔄 Review your list regularly</li>
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