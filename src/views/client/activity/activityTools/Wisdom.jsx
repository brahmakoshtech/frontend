import { ref } from 'vue';
import { useRouter } from 'vue-router';
<<<<<<< HEAD
import { ArrowLeftIcon, ChartBarIcon, BookOpenIcon } from '@heroicons/vue/24/outline';
=======
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c

export default {
  name: 'WisdomActivity',
  setup() {
    const router = useRouter();
<<<<<<< HEAD
    const selectedTeaching = ref(null);

    const goBack = () => {
      router.push('/client/activity');
    };

    const teachings = [
      {
        id: 1,
        title: 'The Four Noble Truths',
        author: 'Buddha',
        content: 'Life contains suffering. Suffering arises from attachment. Suffering ceases when attachment ceases. Freedom from suffering is possible through the Eightfold Path.',
        category: 'Buddhism',
        readTime: '5 min'
      },
      {
        id: 2,
        title: 'Bhagavad Gita Wisdom',
        author: 'Krishna',
        content: 'You have the right to perform your actions, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities.',
        category: 'Hinduism',
        readTime: '7 min'
      },
      {
        id: 3,
        title: 'The Power of Now',
        author: 'Eckhart Tolle',
        content: 'The present moment is the only time over which we have dominion. Life is now. There was never a time when your life was not now.',
        category: 'Modern Spirituality',
        readTime: '6 min'
      },
      {
        id: 4,
        title: 'Sufi Wisdom',
        author: 'Rumi',
        content: 'Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself. The wound is the place where the Light enters you.',
        category: 'Sufism',
        readTime: '4 min'
      }
    ];

    const quotes = [
      'The only true wisdom is in knowing you know nothing. - Socrates',
      'Wisdom begins in wonder. - Socrates',
      'The journey of a thousand miles begins with one step. - Lao Tzu',
      'Be yourself; everyone else is already taken. - Oscar Wilde'
    ];

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
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
                    <ChartBarIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Wisdom
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Spiritual teachings and wisdom sharing</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Teachings */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h3 class="fw-bold mb-3">Sacred Teachings</h3>
                    <div class="row g-3">
                      {teachings.map(teaching => (
                        <div key={teaching.id} class="col-md-6">
                          <div 
                            class={`card border-2 rounded-4 h-100 ${selectedTeaching.value?.id === teaching.id ? 'border-success' : 'border-light'}`}
                            style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                            onClick={() => selectedTeaching.value = teaching}
                          >
                            <div class="card-body p-3">
                              <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge bg-success-subtle text-success px-2 py-1 rounded-pill small">
                                  {teaching.category}
                                </span>
                                <small class="text-muted">{teaching.readTime}</small>
                              </div>
                              <h6 class="fw-bold mb-2">{teaching.title}</h6>
                              <p class="text-muted small mb-2">by {teaching.author}</p>
                              <p class="small mb-0">{teaching.content.substring(0, 100)}...</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Selected Teaching */}
                {selectedTeaching.value && (
                  <div class="card border-0 shadow-sm rounded-4">
                    <div class="card-body p-4">
                      <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h4 class="fw-bold mb-1 text-success">{selectedTeaching.value.title}</h4>
                          <p class="text-muted mb-0">by {selectedTeaching.value.author}</p>
                        </div>
                        <span class="badge bg-success px-3 py-2 rounded-pill">
                          {selectedTeaching.value.category}
                        </span>
                      </div>
                      <div class="p-4 bg-light rounded-4 mb-3">
                        <p class="mb-0 lh-lg" style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>
                          "{selectedTeaching.value.content}"
                        </p>
                      </div>
                      <div class="text-center">
                        <button class="btn btn-success rounded-pill px-4">
                          <BookOpenIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />
                          Read Full Teaching
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div class="col-lg-4">
                {/* Daily Quote */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Daily Wisdom</h5>
                    <div class="p-3 bg-success-subtle rounded-4">
                      <p class="mb-0 text-center fst-italic">
                        {quotes[Math.floor(Math.random() * quotes.length)]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">📚 Knowledge</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🧠 Understanding</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">✨ Enlightenment</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🎯 Clarity</span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Wisdom Traditions</h5>
                    <div class="d-flex flex-column gap-2">
                      <div class="p-2 bg-light rounded-3">🕉️ Hinduism</div>
                      <div class="p-2 bg-light rounded-3">☸️ Buddhism</div>
                      <div class="p-2 bg-light rounded-3">🌙 Sufism</div>
                      <div class="p-2 bg-light rounded-3">✨ Modern Spirituality</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
=======
    const goBack = () => router.push('/client/activity');
    return () => (
      <div class="container-fluid px-4">
        <div class="row"><div class="col-12">
        <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={goBack}>
        <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />Back</button>
        <div><h1 class="mb-0 fw-bold">📚 Spiritual Wisdom</h1><p class="text-muted mb-0">Ancient teachings</p></div></div>
        <div class="card border-0 shadow-sm rounded-4"><div class="card-body p-5 text-center">
        <div class="display-1 mb-3">📚</div><h3 class="fw-bold mb-3">Wisdom Practice</h3>
        <p class="text-muted">Coming soon</p></div></div></div></div></div>
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
    );
  }
};