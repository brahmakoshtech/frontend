import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, PlusIcon, BellIcon, PaperAirplaneIcon } from '@heroicons/vue/24/outline';
import notificationService from '../../../services/notificationService.js';

export default {
  name: 'ClientPushNotification',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const submitting = ref(false);
    const users = ref([]);
    const groups = ref([]);
    const campaigns = ref([]);

    const showCreateGroupModal = ref(false);
    const newGroup = ref({
      name: '',
      description: '',
      userIds: []
    });

    const form = ref({
      targetType: 'group',
      groupId: '',
      userIds: [],
      name: '',
      description: '',
      url: '',
      postType: 'immediate',
      scheduledFor: ''
    });

    const goBack = () => {
      router.push('/client/tools');
    };

    const fetchAllData = async () => {
      loading.value = true;
      try {
        const [usersRes, groupsRes, campaignsRes] = await Promise.all([
          notificationService.getClientUsers(),
          notificationService.getClientGroups(),
          notificationService.getClientCampaigns()
        ]);
        users.value = usersRes.data || [];
        groups.value = groupsRes.data || [];
        campaigns.value = campaignsRes.data || [];
      } catch (error) {
        alert(error.message || 'Failed to load notification sender data');
      } finally {
        loading.value = false;
      }
    };

    const selectedRecipientsCount = computed(() => {
      if (form.value.targetType === 'group') {
        const group = groups.value.find((g) => g._id === form.value.groupId);
        return group?.userIds?.length || 0;
      }
      return form.value.userIds.length;
    });

    const createGroup = async () => {
      try {
        if (!newGroup.value.name.trim()) {
          alert('Please enter group name');
          return;
        }
        if (!newGroup.value.userIds.length) {
          alert('Please select at least one user');
          return;
        }

        await notificationService.createClientGroup({
          name: newGroup.value.name,
          description: newGroup.value.description,
          userIds: newGroup.value.userIds
        });

        newGroup.value = { name: '', description: '', userIds: [] };
        showCreateGroupModal.value = false;
        await fetchAllData();
      } catch (error) {
        alert(error.message || 'Failed to create group');
      }
    };

    const submitCampaign = async () => {
      try {
        if (!form.value.name.trim()) {
          alert('Please enter notification name');
          return;
        }
        if (!form.value.description.trim()) {
          alert('Please enter description');
          return;
        }
        if (selectedRecipientsCount.value === 0) {
          alert('Please select users or group');
          return;
        }
        if (form.value.postType === 'scheduled' && !form.value.scheduledFor) {
          alert('Please select post date and time');
          return;
        }

        submitting.value = true;
        await notificationService.createClientCampaign({
          groupId: form.value.targetType === 'group' ? form.value.groupId : null,
          userIds: form.value.targetType === 'users' ? form.value.userIds : [],
          name: form.value.name,
          description: form.value.description,
          url: form.value.url,
          postType: form.value.postType,
          scheduledFor: form.value.postType === 'scheduled' ? form.value.scheduledFor : null
        });

        form.value = {
          targetType: 'group',
          groupId: '',
          userIds: [],
          name: '',
          description: '',
          url: '',
          postType: 'immediate',
          scheduledFor: ''
        };

        await fetchAllData();
        alert('Notification posted successfully');
      } catch (error) {
        alert(error.message || 'Failed to post notification');
      } finally {
        submitting.value = false;
      }
    };

    const getStatusBadge = (status) => {
      const badges = {
        sent: 'bg-success',
        scheduled: 'bg-warning',
        failed: 'bg-danger'
      };
      return badges[status] || 'bg-secondary';
    };

    onMounted(() => {
      fetchAllData();
    });

    return () => (
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="d-flex align-items-center mb-4">
              <button 
                class="btn btn-outline-secondary me-3" 
                onClick={goBack}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                Back to Tools
              </button>
              <div class="flex-grow-1">
                <h1 class="mb-0 text-primary">Post Notification</h1>
                <p class="text-muted mb-0">Create groups, select users and post immediate/scheduled notifications</p>
              </div>
              <button 
                class="btn btn-primary"
                onClick={() => showCreateGroupModal.value = true}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Create Group
              </button>
            </div>

            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                  <div class="card-body">
                    <h3 class="text-primary">{campaigns.value.filter(n => n.status === 'sent').length}</h3>
                    <p class="text-muted mb-0">Sent</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                  <div class="card-body">
                    <h3 class="text-warning">{campaigns.value.filter(n => n.status === 'scheduled').length}</h3>
                    <p class="text-muted mb-0">Scheduled</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                  <div class="card-body">
                    <h3 class="text-info">{groups.value.length}</h3>
                    <p class="text-muted mb-0">Groups</p>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                  <div class="card-body">
                    <h3 class="text-success">{users.value.length}</h3>
                    <p class="text-muted mb-0">Total Recipients</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm mb-4">
              <div class="card-header bg-white">
                <h5 class="mb-0">Create Post Notification</h5>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Target Type</label>
                    <select
                      class="form-select"
                      value={form.value.targetType}
                      onChange={(e) => (form.value.targetType = e.target.value)}
                    >
                      <option value="group">Group</option>
                      <option value="users">Users</option>
                    </select>
                  </div>

                  {form.value.targetType === 'group' ? (
                    <div class="col-md-8">
                      <label class="form-label">Select Group</label>
                      <select
                        class="form-select"
                        value={form.value.groupId}
                        onChange={(e) => (form.value.groupId = e.target.value)}
                      >
                        <option value="">Choose a group</option>
                        {groups.value.map((group) => (
                          <option value={group._id} key={group._id}>
                            {group.name} ({group.userIds?.length || 0} users)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div class="col-md-8">
                      <label class="form-label">Select Users</label>
                      <select
                        class="form-select"
                        multiple
                        style={{ minHeight: '140px' }}
                        onChange={(e) =>
                          (form.value.userIds = Array.from(e.target.selectedOptions).map((option) => option.value))
                        }
                      >
                        {users.value.map((user) => (
                          <option value={user._id} key={user._id}>
                            {(user.profile?.name || user.email)} - {user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div class="col-md-6">
                    <label class="form-label">Notification Name</label>
                    <input
                      class="form-control"
                      value={form.value.name}
                      onInput={(e) => (form.value.name = e.target.value)}
                      placeholder="Enter notification name"
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">URL</label>
                    <input
                      class="form-control"
                      value={form.value.url}
                      onInput={(e) => (form.value.url = e.target.value)}
                      placeholder="https://example.com/page"
                    />
                  </div>

                  <div class="col-12">
                    <label class="form-label">Description</label>
                    <textarea
                      class="form-control"
                      rows="3"
                      value={form.value.description}
                      onInput={(e) => (form.value.description = e.target.value)}
                      placeholder="Enter notification description"
                    />
                  </div>

                  <div class="col-md-4">
                    <label class="form-label">Post Type</label>
                    <select
                      class="form-select"
                      value={form.value.postType}
                      onChange={(e) => (form.value.postType = e.target.value)}
                    >
                      <option value="immediate">Immediate Post</option>
                      <option value="scheduled">Post Date & Time</option>
                    </select>
                  </div>

                  {form.value.postType === 'scheduled' && (
                    <div class="col-md-4">
                      <label class="form-label">Post Date & Time</label>
                      <input
                        type="datetime-local"
                        class="form-control"
                        value={form.value.scheduledFor}
                        onInput={(e) => (form.value.scheduledFor = e.target.value)}
                      />
                    </div>
                  )}

                  <div class="col-md-4 d-flex align-items-end">
                    <div class="w-100">
                      <div class="text-muted mb-2">Recipients: {selectedRecipientsCount.value}</div>
                      <button class="btn btn-primary w-100" onClick={submitCampaign} disabled={submitting.value}>
                        <PaperAirplaneIcon style={{ width: '1rem', height: '1rem' }} class="me-2" />
                        {submitting.value ? 'Posting...' : 'Post Notification'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card border-0 shadow-sm">
              <div class="card-header bg-white">
                <h5 class="mb-0">Notification History</h5>
              </div>
              <div class="card-body p-0">
                {loading.value ? (
                  <div class="text-center py-5">Loading...</div>
                ) : campaigns.value.length === 0 ? (
                  <div class="text-center py-5">
                    <BellIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} />
                    <h4 class="text-muted mt-3">No notifications posted</h4>
                  </div>
                ) : (
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Name</th>
                          <th>Status</th>
                          <th>Recipients</th>
                          <th>URL</th>
                          <th>Post Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.value.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <div>
                                <h6 class="mb-1">{item.name}</h6>
                                <small class="text-muted">{item.description}</small>
                              </div>
                            </td>
                            <td>
                              <span class={`badge ${getStatusBadge(item.status)}`}>{item.status}</span>
                            </td>
                            <td>{item.totalRecipients || 0}</td>
                            <td>{item.url ? <a href={item.url} target="_blank">{item.url}</a> : '-'}</td>
                            <td>{new Date(item.sentAt || item.scheduledFor || item.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Create Group Modal */}
            {showCreateGroupModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Create Notification Group</h5>
                      <button class="btn-close" onClick={() => (showCreateGroupModal.value = false)}></button>
                    </div>
                    <div class="modal-body">
                      <div class="mb-3">
                        <label class="form-label">Group Name</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          value={newGroup.value.name}
                          onInput={(e) => (newGroup.value.name = e.target.value)}
                          placeholder="Enter group name"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Group Description</label>
                        <textarea 
                          class="form-control" 
                          rows="3"
                          value={newGroup.value.description}
                          onInput={(e) => (newGroup.value.description = e.target.value)}
                          placeholder="Optional description"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Select Users</label>
                        <select
                          class="form-select"
                          multiple
                          style={{ minHeight: '180px' }}
                          onChange={(e) =>
                            (newGroup.value.userIds = Array.from(e.target.selectedOptions).map((option) => option.value))
                          }
                        >
                          {users.value.map((user) => (
                            <option value={user._id} key={user._id}>
                              {(user.profile?.name || user.email)} - {user.email}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => (showCreateGroupModal.value = false)}>Cancel</button>
                      <button class="btn btn-primary" onClick={createGroup}>
                        Create Group
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};