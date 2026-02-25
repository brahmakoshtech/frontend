import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'MobileCreditsHistory',
  setup() {
    const loading = ref(false);
    const error = ref('');
    const items = ref([]);
    const page = ref(1);
    const limit = ref(20);
    const totalPages = ref(1);

    const loadHistory = async () => {
      try {
        loading.value = true;
        error.value = '';
        const res = await api.getUserChatCreditHistory({ page: page.value, limit: limit.value });
        if (res?.success) {
          items.value = res.data || [];
          totalPages.value = res.meta?.totalPages || 1;
        } else {
          error.value = res?.message || 'Failed to load credit history';
        }
      } catch (e) {
        error.value = e?.response?.data?.message || e.message || 'Failed to load credit history';
      } finally {
        loading.value = false;
      }
    };

    const playRecording = async (key) => {
      if (!key) return;
      try {
        const res = await api.get(`/upload/presigned-url/${encodeURIComponent(key)}`);
        const payload = res?.data || res;
        const url = payload?.data?.presignedUrl;
        if (url) {
          window.open(url, '_blank');
        } else {
          // Simple fallback; avoid throwing to keep UX smooth
          // eslint-disable-next-line no-alert
          alert('Unable to load audio recording.');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to load audio recording', e);
        // eslint-disable-next-line no-alert
        alert('Failed to load audio recording.');
      }
    };

    const nextPage = () => {
      if (page.value < totalPages.value) {
        page.value += 1;
        loadHistory();
      }
    };

    const prevPage = () => {
      if (page.value > 1) {
        page.value -= 1;
        loadHistory();
      }
    };

    onMounted(() => {
      loadHistory();
    });

    const formatDateTime = (value) => {
      if (!value) return '';
      return new Date(value).toLocaleString();
    };

    return () => (
      <div class="container-fluid px-4 py-4">
        <h1 class="h4 fw-bold text-dark mb-2">Credit History</h1>
        <p class="text-muted mb-4" style="font-size: 0.9rem;">
          See how many credits you spent on chat / voice / video consultations.
        </p>

        {error.value && (
          <div class="alert alert-danger py-2" role="alert">
            {error.value}
          </div>
        )}

        {loading.value ? (
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : items.value.length === 0 ? (
          <div class="text-center py-5 text-muted">
            <p class="mb-1">No credit history yet.</p>
            <p style="font-size: 0.9rem;">Start a chat to see your spending here.</p>
          </div>
        ) : (
          <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                {items.value.map((entry) => (
                  <div key={entry.conversationId} class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="me-3">
                      <div class="fw-semibold" style="font-size: 0.95rem;">
                        {entry.partner?.name || entry.partner?.email || 'Partner'}
                      </div>
                      <div class="text-muted" style="font-size: 0.78rem;">
                        <span class="badge bg-secondary" style="font-weight:600;">
                          {(entry.serviceType || 'chat').toUpperCase()}
                        </span>
                      </div>
                      <div class="text-muted" style="font-size: 0.8rem;">
                        {formatDateTime(entry.createdAt)}
                      </div>
                      <div class="text-muted" style="font-size: 0.8rem;">
                        {entry.billableMinutes} min • Conversation: {entry.conversationId}
                      </div>
                      {entry.voiceRecordings && (
                        <div class="mt-1" style="font-size: 0.8rem;">
                          {entry.voiceRecordings.user?.key && (
                            <button
                              class="btn btn-sm btn-outline-primary me-1"
                              type="button"
                              onClick={() => playRecording(entry.voiceRecordings.user.key)}
                            >
                              Play (You)
                            </button>
                          )}
                          {entry.voiceRecordings.partner?.key && (
                            <button
                              class="btn btn-sm btn-outline-primary"
                              type="button"
                              onClick={() => playRecording(entry.voiceRecordings.partner.key)}
                            >
                              Play (Partner)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div class="text-end">
                      <div class="fw-bold text-danger" style="font-size: 0.95rem;">
                        -{entry.creditsUsed} cr
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div class="card-footer d-flex justify-content-between align-items-center">
              <button
                class="btn btn-sm btn-outline-secondary"
                disabled={page.value <= 1}
                onClick={prevPage}
              >
                Previous
              </button>
              <span class="text-muted" style="font-size: 0.85rem;">
                Page {page.value} of {totalPages.value}
              </span>
              <button
                class="btn btn-sm btn-outline-secondary"
                disabled={page.value >= totalPages.value}
                onClick={nextPage}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
};

