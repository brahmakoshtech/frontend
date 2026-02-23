// frontend/src/views/client/PendingPartners.jsx

import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientPendingPartners',
  setup() {
    const partners = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const approving = ref(null);
    const rejecting = ref(null);

    const fetchPartners = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await api.getPendingPartners();
        partners.value = response?.data?.partners ?? response?.partners ?? [];
      } catch (err) {
        error.value = err.message || 'Failed to fetch pending partners';
        partners.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handleApprove = async (partner) => {
      approving.value = partner._id;
      try {
        await api.approvePartner(partner._id);
        partners.value = partners.value.filter((p) => p._id !== partner._id);
      } catch (err) {
        alert(err.message || 'Failed to approve partner');
      } finally {
        approving.value = null;
      }
    };

    const handleReject = async (partner) => {
      const reason = window.prompt('Rejection reason (optional):');
      if (reason === null) return; // User cancelled
      rejecting.value = partner._id;
      try {
        await api.rejectPartner(partner._id, reason);
        partners.value = partners.value.filter((p) => p._id !== partner._id);
      } catch (err) {
        alert(err.message || 'Failed to reject partner');
      } finally {
        rejecting.value = null;
      }
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    onMounted(() => {
      fetchPartners();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Partners Pending Approval</h1>
            <button
              onClick={fetchPartners}
              class="btn btn-outline-primary btn-sm"
              disabled={loading.value}
            >
              Refresh
            </button>
          </div>
          <p class="text-muted mb-4">
            Partners who have completed registration and are waiting for your approval to login.
          </p>

          {loading.value && (
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error.value && (
            <div class="alert alert-danger" role="alert">
              {error.value}
            </div>
          )}

          {!loading.value && !error.value && partners.value.length === 0 && (
            <div class="alert alert-info" role="alert">
              No partners pending approval. All registered partners have been reviewed.
            </div>
          )}

          {!loading.value && partners.value.length > 0 && (
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Expertise</th>
                    <th>Registered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.value.map((partner) => (
                    <tr key={partner._id}>
                      <td>{partner.name || '-'}</td>
                      <td>{partner.email || '-'}</td>
                      <td>{partner.phone || '-'}</td>
                      <td>{partner.expertiseCategory || partner.expertise?.[0] || '-'}</td>
                      <td>{formatDate(partner.createdAt)}</td>
                      <td>
                        <button
                          onClick={() => handleApprove(partner)}
                          class="btn btn-success btn-sm me-2"
                          disabled={approving.value === partner._id}
                        >
                          {approving.value === partner._id ? (
                            <span class="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            'Approve'
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(partner)}
                          class="btn btn-outline-danger btn-sm"
                          disabled={rejecting.value === partner._id}
                        >
                          {rejecting.value === partner._id ? (
                            <span class="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            'Reject'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  },
};
