import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, ClockIcon, PencilIcon, BookOpenIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'SelfReflectionActivity',
  setup() {
    const router = useRouter();
    const selectedPrompt = ref(null);
    const reflection = ref('');
    const savedReflections = ref([
      {
        id: 1,
        prompt: 'What did I learn about myself today?',
        content: 'I discovered that I am more resilient than I thought...',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        prompt: 'What am I most proud of this week?',
        content: 'I am proud of how I handled the challenging situation at work...',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ]);

    const goBack = () => {
      router.push('/client/activity');
    };

    const saveReflection = () => {
      if (reflection.value.trim() && selectedPrompt.value) {
        savedReflections.value.unshift({
          id: Date.now(),
          prompt: selectedPrompt.value,
          content: reflection.value.trim(),
          date: new Date()
        });
        reflection.value = '';
        selectedPrompt.value = null;
      }
    };

    const reflectionPrompts = [
      {
        category: 'Daily Reflection',
        prompts: [
          'What did I learn about myself today?',
          'What challenged me today and how did I respond?',
          'What am I most grateful for today?',
          'How did I show kindness to myself or others today?'
        ]
      },
      {
        category: 'Personal Growth',
        prompts: [
          'What limiting belief am I ready to release?',
          'How have I grown in the past month?',
          'What would I do if I had no fear?',
          'What does success mean to me right now?'
        ]
      },
      {
        category: 'Relationships',
        prompts: [
          'How can I be a better friend/partner/family member?',
          'What relationships bring me the most joy?',
          'How do I handle conflict in relationships?',
          'What do I need more of in my relationships?'
        ]
      },
      {
        category: 'Life Purpose',
        prompts: [
          'What activities make me lose track of time?',
          'How do I want to be remembered?',
          'What impact do I want to have on the world?',
          'What would my ideal day look like?'
        ]
      }
    ];

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
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
                    <ClockIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Self Reflection
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Inner contemplation and self-discovery</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Reflection Prompts */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">Choose a Reflection Prompt</h4>
                    <div class="accordion" id="promptAccordion">
                      {reflectionPrompts.map((category, categoryIndex) => (
                        <div key={categoryIndex} class="accordion-item border-0 mb-2">
                          <h2 class="accordion-header">
                            <button 
                              class="accordion-button collapsed bg-light rounded-3 fw-semibold"
                              type="button" 
                              data-bs-toggle="collapse" 
                              data-bs-target={`#collapse${categoryIndex}`}
                            >
                              {category.category}
                            </button>
                          </h2>
                          <div 
                            id={`collapse${categoryIndex}`} 
                            class="accordion-collapse collapse"
                            data-bs-parent="#promptAccordion"
                          >
                            <div class="accordion-body p-3">
                              <div class="row g-2">
                                {category.prompts.map((prompt, promptIndex) => (
                                  <div key={promptIndex} class="col-md-6">
                                    <button 
                                      class={`btn btn-outline-indigo rounded-3 w-100 text-start p-3 ${selectedPrompt.value === prompt ? 'active' : ''}`}
                                      onClick={() => selectedPrompt.value = prompt}
                                    >
                                      {prompt}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Writing Area */}
                {selectedPrompt.value && (
                  <div class="card border-0 shadow-sm rounded-4 mb-4">
                    <div class="card-body p-4">
                      <h5 class="fw-bold mb-3 text-indigo">Reflect on: "{selectedPrompt.value}"</h5>
                      <textarea 
                        class="form-control form-control-lg rounded-4 mb-3"
                        rows="8"
                        placeholder="Take your time to reflect deeply. Write whatever comes to mind..."
                        v-model={reflection.value}
                        style={{ resize: 'none', border: '2px solid #e5e7eb' }}
                      ></textarea>
                      <div class="d-flex justify-content-between align-items-center">
                        <small class="text-muted">{reflection.value.length} characters</small>
                        <button 
                          class="btn btn-indigo rounded-pill px-4"
                          onClick={saveReflection}
                          disabled={!reflection.value.trim()}
                        >
                          <PencilIcon style={{ width: '1.25rem', height: '1.25rem' }} class="me-2" />
                          Save Reflection
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Past Reflections */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">My Reflection Journal</h4>
                    {savedReflections.value.map(item => (
                      <div key={item.id} class="card border-0 bg-light rounded-4 mb-3">
                        <div class="card-body p-3">
                          <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold text-indigo mb-0">{item.prompt}</h6>
                            <small class="text-muted">{formatDate(item.date)}</small>
                          </div>
                          <p class="mb-0 text-muted">{item.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                {/* Reflection Quote */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Wisdom for Reflection</h5>
                    <div class="p-4 bg-indigo-subtle rounded-4 text-center">
                      <BookOpenIcon style={{ width: '2.5rem', height: '2.5rem' }} class="text-indigo mb-3" />
                      <p class="mb-2 fst-italic">
                        "The unexamined life is not worth living."
                      </p>
                      <small class="text-muted">- Socrates</small>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🧠 Self Awareness</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">📈 Growth</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">💡 Understanding</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🎯 Clarity</span>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Reflection Stats</h5>
                    <div class="row text-center">
                      <div class="col-6">
                        <div class="p-3 bg-light rounded-3">
                          <div class="fs-4 fw-bold text-indigo">{savedReflections.value.length}</div>
                          <small class="text-muted">Total Entries</small>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 bg-light rounded-3">
                          <div class="fs-4 fw-bold text-indigo">5</div>
                          <small class="text-muted">This Week</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Reflection Tips</h5>
                    <ul class="list-unstyled">
                      <li class="mb-2">🕯️ Find a quiet, comfortable space</li>
                      <li class="mb-2">📝 Write freely without judgment</li>
                      <li class="mb-2">🤔 Ask yourself "why" questions</li>
                      <li class="mb-2">🔄 Review past reflections regularly</li>
                      <li class="mb-0">💭 Be honest with yourself</li>
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