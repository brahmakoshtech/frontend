// frontend/src/views/client/PendingPartners.jsx

import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientPendingPartners',
  setup() {
    const activeTab = ref('all');
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
      response?.data?.partners ??
      response?.partners ??
      response?.data?.data?.partners ??
      [];

    const extractTotal = (response) =>
      response?.data?.total ??
      response?.total ??
      response?.data?.data?.total ??
      (Array.isArray(extractPartners(response)) ? extractPartners(response).length : 0);

    // ✅ FIX: Load all tab counts on mount in parallel
    onMounted(async () => {
      loading.value = true;
      error.value = null;
      try {
        const [allRes, pendingRes, rejectedRes] = await Promise.all([
          api.getPartners({ status: 'all', limit: 100 }),
          api.getPartners({ status: 'pending', limit: 100 }),
          api.getPartners({ status: 'rejected', limit: 100 }),
        ]);

        totals.value.all = extractTotal(allRes);
        totals.value.pending = extractTotal(pendingRes);
        totals.value.rejected = extractTotal(rejectedRes);

        // Default to showing 'all' tab
        partners.value = extractPartners(allRes);
      } catch (err) {
        error.value = err.message || 'Failed to load partners';
        partners.value = [];
      } finally {
        loading.value = false;
      }
    });

    const fetchPartners = async (tab = activeTab.value) => {
      loading.value = true;
      error.value = null;
      try {
        let response;
        if (tab === 'pending') {
          response = await api.getPartners({ status: 'pending', limit: 100 });
        } else if (tab === 'rejected') {
          response = await api.getPartners({ status: 'rejected', limit: 100 });
        } else {
          response = await api.getPartners({ status: 'all', limit: 100 });
        }

        const list = extractPartners(response);
        const total = extractTotal(response);

        partners.value = list;
        totals.value[tab] = total;
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
        // Refresh all counts after approval
        const [allRes, pendingRes] = await Promise.all([
          api.getPartners({ status: 'all', limit: 100 }),
          api.getPartners({ status: 'pending', limit: 100 }),
        ]);
        totals.value.all = extractTotal(allRes);
        totals.value.pending = extractTotal(pendingRes);
        partners.value = extractPartners(
          activeTab.value === 'all' ? allRes :
          activeTab.value === 'pending' ? pendingRes : allRes
        );
      } catch (err) {
        alert(err.message || 'Failed to approve partner');
      } finally {
        approving.value = null;
      }
    };

    const handleReject = async (partner) => {
      const reason = window.prompt('Rejection reason (optional):');
      if (reason === null) return;
      rejecting.value = partner._id;
      try {
        await api.rejectPartner(partner._id, reason);
        // Refresh all counts after rejection
        const [allRes, pendingRes, rejectedRes] = await Promise.all([
          api.getPartners({ status: 'all', limit: 100 }),
          api.getPartners({ status: 'pending', limit: 100 }),
          api.getPartners({ status: 'rejected', limit: 100 }),
        ]);
        totals.value.all = extractTotal(allRes);
        totals.value.pending = extractTotal(pendingRes);
        totals.value.rejected = extractTotal(rejectedRes);

        if (activeTab.value === 'all') partners.value = extractPartners(allRes);
        else if (activeTab.value === 'pending') partners.value = extractPartners(pendingRes);
        else partners.value = extractPartners(rejectedRes);
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
        // Refresh all counts after delete
        const [allRes, pendingRes, rejectedRes] = await Promise.all([
          api.getPartners({ status: 'all', limit: 100 }),
          api.getPartners({ status: 'pending', limit: 100 }),
          api.getPartners({ status: 'rejected', limit: 100 }),
        ]);
        totals.value.all = extractTotal(allRes);
        totals.value.pending = extractTotal(pendingRes);
        totals.value.rejected = extractTotal(rejectedRes);

        if (activeTab.value === 'all') partners.value = extractPartners(allRes);
        else if (activeTab.value === 'pending') partners.value = extractPartners(pendingRes);
        else partners.value = extractPartners(rejectedRes);
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

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Partners</h1>
            <button
              onClick={async () => {
                // Refresh all tabs on manual refresh
                loading.value = true;
                try {
                  const [allRes, pendingRes, rejectedRes] = await Promise.all([
                    api.getPartners({ status: 'all', limit: 100 }),
                    api.getPartners({ status: 'pending', limit: 100 }),
                    api.getPartners({ status: 'rejected', limit: 100 }),
                  ]);
                  totals.value.all = extractTotal(allRes);
                  totals.value.pending = extractTotal(pendingRes);
                  totals.value.rejected = extractTotal(rejectedRes);

                  if (activeTab.value === 'all') partners.value = extractPartners(allRes);
                  else if (activeTab.value === 'pending') partners.value = extractPartners(pendingRes);
                  else partners.value = extractPartners(rejectedRes);
                } catch (err) {
                  error.value = err.message || 'Failed to refresh';
                } finally {
                  loading.value = false;
                }
              }}
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
                All Partners ({totals.value.all})
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class={activeTab.value === 'pending' ? 'nav-link active' : 'nav-link'}
                onClick={() => switchTab('pending')}
              >
                Approval Requests ({totals.value.pending})
              </button>
            </li>
            <li class="nav-item">
              <button
                type="button"
                class={activeTab.value === 'rejected' ? 'nav-link active' : 'nav-link'}
                onClick={() => switchTab('rejected')}
              >
                Rejected ({totals.value.rejected})
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