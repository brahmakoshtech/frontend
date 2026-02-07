import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'AdminKarmaPoints',
  setup() {
    const users = ref([]);
    const loading = ref(false);
    const search = ref('');
    const page = ref(1);
    const limit = ref(25);
    const total = ref(0);
    const selectedUser = ref(null);
    const karmaForm = ref({
      amount: '',
      description: ''
    });

    const fetchUsers = async () => {
      loading.value = true;
      try {
        const params = new URLSearchParams({
          page: String(page.value),
          limit: String(limit.value),
        });
        if (search.value) {
          params.append('search', search.value);
        }
        const response = await api.getAdminUsers(`?${params.toString()}`);
        const data = response.data || {};
        users.value = data.users || data.data?.users || [];
        total.value = data.total ?? data.data?.total ?? users.value.length;
      } catch (error) {
        console.error('[AdminKarmaPoints] Failed to fetch users:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleAddKarmaPoints = async (user) => {
      try {
        const response = await api.getAdminUsers(`?search=${user.email}`);
        const data = response.data || {};
        const users = data.users || data.data?.users || [];
        const freshUser = users.find(u => u._id === user._id) || user;
        selectedUser.value = freshUser;
        karmaForm.value = {
          amount: '',
          description: ''
        };
      } catch (e) {
        selectedUser.value = user;
        karmaForm.value = {
          amount: '',
          description: ''
        };
      }
    };

    const submitKarmaPoints = async () => {
      if (!selectedUser.value) return;
      const amount = parseInt(karmaForm.value.amount);
      if (!amount || amount <= 0) {
        alert('Please enter a valid positive number');
        return;
      }
      try {
        const res = await api.addUserKarmaPoints(
          selectedUser.value._id,
          amount,
          karmaForm.value.description || undefined
        );
        const newBalance = res?.data?.newBalance ?? (selectedUser.value.karmaPoints || 0) + amount;
        alert(`Karma points added successfully. New balance: ${newBalance}`);
        selectedUser.value = null;
        karmaForm.value = { amount: '', description: '' };
        await fetchUsers();
      } catch (e) {
        console.error('[AdminKarmaPoints] Failed to add karma points', e);
        alert(e?.message || 'Failed to add karma points');
      }
    };

    const totalPages = () => Math.max(Math.ceil(total.value / limit.value), 1);

    const goToPage = async (newPage) => {
      const max = totalPages();
      const target = Math.min(Math.max(newPage, 1), max);
      if (target === page.value) return;
      page.value = target;
      await fetchUsers();
    };

    const onSearch = async () => {
      page.value = 1;
      await fetchUsers();
    };

    onMounted(() => {
      fetchUsers();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Karma Points</h1>
            <div class="d-flex" style={{ gap: '0.5rem' }}>
              <input
                type="text"
                class="form-control"
                placeholder="Search by email or name..."
                value={search.value}
                onInput={(e) => (search.value = e.target.value)}
                onKeydown={(e) => e.key === 'Enter' && onSearch()}
                style={{ maxWidth: '260px' }}
              />
              <button class="btn btn-outline-primary" onClick={onSearch}>
                Search
              </button>
            </div>
          </div>

          {selectedUser.value && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15,23,42,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1050
              }}
            >
              <div
                class="card shadow-lg"
                style={{ maxWidth: '520px', width: '100%', borderRadius: '12px' }}
              >
                <div class="card-body">
                  <h5 class="mb-3">
                    Add karma points for{' '}
                    <strong>{selectedUser.value.profile?.name || selectedUser.value.email}</strong>
                  </h5>
                  <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                      <label class="form-label">Current Karma Points</label>
                      <input
                        type="number"
                        class="form-control"
                        value={selectedUser.value.karmaPoints ?? 0}
                        disabled
                      />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Karma Points to Add</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        class="form-control"
                        value={karmaForm.value.amount}
                        onInput={(e) => (karmaForm.value.amount = e.target.value)}
                      />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Description (optional)</label>
                      <input
                        type="text"
                        class="form-control"
                        value={karmaForm.value.description}
                        onInput={(e) => (karmaForm.value.description = e.target.value)}
                      />
                    </div>
                  </div>
                  <div class="d-flex justify-content-end gap-2 mt-4">
                    <button class="btn btn-secondary" onClick={() => (selectedUser.value = null)}>
                      Cancel
                    </button>
                    <button class="btn btn-primary" onClick={submitKarmaPoints}>
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading.value && <p>Loading users...</p>}

          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-light">
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Client</th>
                  <th>Karma Points</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.value.map(user => (
                  <tr key={user._id}>
                    <td>{user.email}</td>
                    <td>{user.profile?.name || '-'}</td>
                    <td>{user.clientId?.email || user.clientId?.businessName || '-'}</td>
                    <td>{user.karmaPoints ?? 0}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span class={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleAddKarmaPoints(user)}
                        class="btn btn-warning btn-sm me-2"
                      >
                        Add Karma Points
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
              Page {page.value} of {totalPages()} ({total.value} users)
            </div>
            <div class="btn-group">
              <button
                class="btn btn-outline-secondary btn-sm"
                disabled={page.value <= 1}
                onClick={() => goToPage(page.value - 1)}
              >
                Previous
              </button>
              <button
                class="btn btn-outline-secondary btn-sm"
                disabled={page.value >= totalPages()}
                onClick={() => goToPage(page.value + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
