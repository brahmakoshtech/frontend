import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientCredits',
  setup() {
    const users = ref([]);
    const loading = ref(false);
    const search = ref('');
    const page = ref(1);
    const limit = ref(25);
    const total = ref(0);

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
        const response = await api.getClientUsers(`?${params.toString()}`);
        // /client/users returns { success, data: { users, count, ... } }
        const payload = response.data || response.data?.data || {};
        users.value = payload.users || payload.data?.users || [];
        total.value = payload.total ?? payload.count ?? users.value.length;
      } catch (error) {
        console.error('[ClientCredits] Failed to fetch users:', error);
      } finally {
        loading.value = false;
      }
    };

    const handleAddCredits = async (user) => {
      selectedUser.value = user;
      creditForm.value = { amount: '', description: '' };
    };

    const submitCredits = async () => {
      if (!selectedUser.value) return;
      const amount = parseFloat(creditForm.value.amount);
      if (!amount || amount <= 0) {
        alert('Please enter a valid positive number');
        return;
      }
      try {
        const res = await api.addUserCredits(
          selectedUser.value._id,
          amount,
          creditForm.value.description || undefined
        );
        const newBalance =
          res?.data?.newBalance ??
          res?.data?.user?.credits ??
          (selectedUser.value.credits || 0) + amount;
        selectedUser.value.credits = newBalance;
        alert(`Credits added successfully. New balance: ${newBalance}`);
        selectedUser.value = null;
        creditForm.value = { amount: '', description: '' };
      } catch (e) {
        console.error('[ClientCredits] Failed to add credits', e);
        alert(e?.message || 'Failed to add credits');
      }
    };

    const selectedUser = ref(null);
    const creditForm = ref({
      amount: '',
      description: ''
    });

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
            <h1 class="card-title mb-0">Credits</h1>
            <div class="d-flex" style={{ gap: '0.5rem' }}>
              <input
                type="text"
                class="form-control"
                placeholder="Search by email or name..."
                value={search.value}
                onInput={(e) => (search.value = e.target.value)}
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
                backdropFilter: 'blur(4px)',
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
                    Add credits for{' '}
                    <strong>{selectedUser.value.profile?.name || selectedUser.value.email}</strong>
                  </h5>
                  <div class="row g-3 align-items-end">
                    <div class="col-md-4">
                      <label class="form-label">Current Credits</label>
                      <input
                        type="number"
                        class="form-control"
                        value={selectedUser.value.credits ?? 0}
                        disabled
                      />
                    </div>
                    <div class="col-md-4">
                      <label class="form-label">Credits to Add</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        class="form-control"
                        value={creditForm.value.amount}
                        onInput={(e) => (creditForm.value.amount = e.target.value)}
                      />
                    </div>
                    <div class="col-12">
                      <label class="form-label">Description (optional)</label>
                      <input
                        type="text"
                        class="form-control"
                        value={creditForm.value.description}
                        onInput={(e) => (creditForm.value.description = e.target.value)}
                      />
                    </div>
                  </div>
                  <div class="d-flex justify-content-end gap-2 mt-4">
                    <button class="btn btn-secondary" onClick={() => (selectedUser.value = null)}>
                      Cancel
                    </button>
                    <button class="btn btn-primary" onClick={submitCredits}>
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
                  <th>DOB</th>
                  <th>Place of Birth</th>
                  <th>Credits</th>
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
                    <td>{user.profile?.dob ? new Date(user.profile.dob).toLocaleDateString() : '-'}</td>
                    <td>{user.profile?.placeOfBirth || '-'}</td>
                    <td>{user.credits ?? 0}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span class={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleAddCredits(user)}
                        class="btn btn-warning btn-sm"
                      >
                        Add Credits
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

