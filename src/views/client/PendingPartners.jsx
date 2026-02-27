// frontend/src/views/client/PendingPartners.jsx

import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientPendingPartners',
  setup() {
    const activeTab = ref('all'); // all | pending | rejected
    const partners = ref([]);
    const totals = ref({
      all: 0,
      pending: 0,
      rejected: 0,
    });
    const loading = ref(true);
    const error = ref(null);
    const approving = ref(null);
    const rejecting = ref(null);
    const deleting = ref(null);

    const extractPartners = (response) =>
      response?.data?.partners ?? response?.partners ?? response?.data?.data?.partners ?? [];

    const extractTotal = (response) =>
      response?.data?.total ??
      response?.total ??
      response?.data?.data?.total ??
      (Array.isArray(extractPartners(response)) ? extractPartners(response).length : 0);

    const fetchPartners = async (tab = activeTab.value) => {
      loading.value = true;
      error.value = null;
      try {
        let response;
        if (tab === 'all') response = await api.getPartners({ status: 'all', limit: 100 });
        else if (tab === 'pending') response = await api.getPartners({ status: 'pending', limit: 100 });
        else if (tab === 'rejected') response = await api.getPartners({ status: 'rejected', limit: 100 });
        else response = await api.getPartners({ status: 'all', limit: 100 });

        const list = extractPartners(response);
        partners.value = list;

        const total = extractTotal(response);
        if (tab === 'all') totals.value.all = total;
        else if (tab === 'pending') totals.value.pending = total;
        else if (tab === 'rejected') totals.value.rejected = total;
      } catch (err) {
        error.value = err.message || 'Failed to fetch partners';
        partners.value = [];
      } finally {
        loading.value = false;
      }
    };

    const handleApprove = async (partner) => {
      approving.value = partner._id;
      try {
        await api.approvePartner(partner._id);
        await fetchPartners(activeTab.value);
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
        await fetchPartners(activeTab.value);
      } catch (err) {
        alert(err.message || 'Failed to reject partner');
      } finally {
        rejecting.value = null;
      }
    };

    const handleDelete = async (partner) => {
      const ok = window.confirm(`Delete partner "${partner?.name || partner?.email || 'Partner'}"?`);
      if (!ok) return;
      deleting.value = partner._id;
      try {
        await api.deletePartner(partner._id);
        await fetchPartners(activeTab.value);
      } catch (err) {
        alert(err.message || 'Failed to delete partner');
      } finally {
        deleting.value = null;
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

    const getPartnerStatus = (partner) => {
      if (partner?.verificationStatus === 'rejected') return 'Rejected';
      if (partner?.isActive) return 'Approved';
      return 'Pending';
    };

    const renderStatusBadge = (partner) => {
      const status = getPartnerStatus(partner);
      const cls =
        status === 'Approved'
          ? 'badge bg-success'
          : status === 'Rejected'
            ? 'badge bg-danger'
            : 'badge bg-warning text-dark';
      return <span class={cls}>{status}</span>;
    };

    const switchTab = async (tab) => {
      if (activeTab.value === tab) return;
      activeTab.value = tab;
      await fetchPartners(tab);
    };

    onMounted(() => {
      fetchPartners('all');
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Partners</h1>
            <button
              onClick={() => fetchPartners(activeTab.value)}
              class="btn btn-outline-primary btn-sm"
              disabled={loading.value}
            >
              Refresh
            </button>
          </div>

          <ul class="nav nav-tabs mb-3">
            <li class="nav-item">
              <button
                type="button"
                class={activeTab.value === 'all' ? 'nav-link active' : 'nav-link'}
                onClick={() => switchTab('all')}
              >
                All Partners {totals.value.all ? `(${totals.value.all})` : ''}
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class={activeTab.value === 'pending' ? 'nav-link active' : 'nav-link'}
                onClick={() => switchTab('pending')}
              >
                Approval Requests {totals.value.pending ? `(${totals.value.pending})` : ''}
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class={activeTab.value === 'rejected' ? 'nav-link active' : 'nav-link'}
                onClick={() => switchTab('rejected')}
              >
                Rejected {totals.value.rejected ? `(${totals.value.rejected})` : ''}
              </button>
            </li>
          </ul>

          <p class="text-muted mb-4">
            {activeTab.value === 'pending'
              ? 'Partners who completed registration and are waiting for your approval to login.'
              : activeTab.value === 'rejected'
                ? 'Partners you rejected (they cannot login). You can delete them from here.'
                : 'All partners under your client account.'}
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
              {activeTab.value === 'pending'
                ? 'No partners pending approval.'
                : activeTab.value === 'rejected'
                  ? 'No rejected partners.'
                  : 'No partners found.'}
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
                    <th>Status</th>
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
                      <td>{renderStatusBadge(partner)}</td>
                      <td>{formatDate(partner.createdAt)}</td>
                      <td>
                        {getPartnerStatus(partner) === 'Pending' && (
                          <>
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
                              class="btn btn-outline-danger btn-sm me-2"
                              disabled={rejecting.value === partner._id}
                            >
                              {rejecting.value === partner._id ? (
                                <span class="spinner-border spinner-border-sm" role="status" />
                              ) : (
                                'Reject'
                              )}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(partner)}
                          class="btn btn-outline-secondary btn-sm"
                          disabled={deleting.value === partner._id}
                        >
                          {deleting.value === partner._id ? (
                            <span class="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            'Delete'
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
