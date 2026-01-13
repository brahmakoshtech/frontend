import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, HeartIcon, HandRaisedIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'PrathanaActivity',
  setup() {
    const router = useRouter();
    const selectedPrayer = ref(null);

    const goBack = () => {
      router.push('/client/activity');
    };

    const prayers = [
      {
        id: 1,
        title: 'Morning Prayer',
        text: 'Divine light, guide my path today. Fill my heart with love and my mind with wisdom. May I serve others with compassion.',
        duration: '5 min'
      },
      {
        id: 2,
        title: 'Gratitude Prayer',
        text: 'Thank you for all the blessings in my life. For family, friends, health, and opportunities. I am grateful for this moment.',
        duration: '3 min'
      },
      {
        id: 3,
        title: 'Peace Prayer',
        text: 'May peace prevail in my heart, in my home, and in the world. Let harmony flow through all beings and all creation.',
        duration: '7 min'
      },
      {
        id: 4,
        title: 'Evening Prayer',
        text: 'As this day ends, I offer my gratitude. Forgive my mistakes and bless my dreams. Watch over all beings tonight.',
        duration: '6 min'
      }
    ];

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' }}>
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
                    Prathana
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Devotional prayers and spiritual connection</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Prayer Selection */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h3 class="fw-bold mb-3">Choose Your Prayer</h3>
                    <div class="row g-3">
                      {prayers.map(prayer => (
                        <div key={prayer.id} class="col-md-6">
                          <div 
                            class={`card border-2 rounded-4 h-100 ${selectedPrayer.value?.id === prayer.id ? 'border-danger' : 'border-light'}`}
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                            onClick={() => selectedPrayer.value = prayer}
                          >
                            <div class="card-body p-3">
                              <h6 class="fw-bold mb-2">{prayer.title}</h6>
                              <p class="text-muted small mb-2">{prayer.text.substring(0, 80)}...</p>
                              <small class="text-muted">{prayer.duration}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Prayer */}
                {selectedPrayer.value && (
                  <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body p-4">
                      <h4 class="fw-bold mb-3 text-danger">{selectedPrayer.value.title}</h4>
                      <div class="p-4 bg-light rounded-4 mb-4">
                        <p class="mb-0 lh-lg" style={{ fontSize: '1.1rem' }}>
                          {selectedPrayer.value.text}
                        </p>
                      </div>
                      <div class="text-center">
                        <button class="btn btn-danger btn-lg rounded-pill px-4">
                          <HandRaisedIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />
                          Begin Prayer
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div class="col-lg-4">
                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🙏 Divine Connection</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">💝 Gratitude</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">✨ Faith Building</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">❤️ Heart Opening</span>
                    </div>
                  </div>
                </div>

                {/* Guidelines */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Prayer Guidelines</h5>
                    <ul class="list-unstyled">
                      <li class="mb-2">🕯️ Create a peaceful space</li>
                      <li class="mb-2">🧘 Sit or kneel comfortably</li>
                      <li class="mb-2">💭 Speak from your heart</li>
                      <li class="mb-2">🤲 Open your hands in prayer</li>
                      <li class="mb-0">🌟 Feel the divine presence</li>
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