// frontend/src/views/client/Users.jsx

import { ref, onMounted } from 'vue';
import api from '../../services/api.js';

export default {
  name: 'ClientUsers',
  setup() {
    const users = ref([]);
    const showCreateModal = ref(false);
    const showDetailsModal = ref(false);
    const selectedUser = ref(null);
    const userDetails = ref(null);
    const loadingDetails = ref(false);
    const newUser = ref({ 
      email: '', 
      password: '', 
      profile: {
        name: '',
        dob: '',
        timeOfBirth: '',
        placeOfBirth: '',
        latitude: null,
        longitude: null,
        gowthra: ''
      }
    });

    const fetchUsers = async () => {
      try {
        const response = await api.getClientUsers();
        users.value = response.data.users;
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    const handleCreate = async (e) => {
      e.preventDefault();
      try {
        await api.createClientUser(
          newUser.value.email, 
          newUser.value.password, 
          newUser.value.profile
        );
        showCreateModal.value = false;
        newUser.value = { 
          email: '', 
          password: '', 
          profile: { 
            name: '', 
            dob: '', 
            timeOfBirth: '',
            placeOfBirth: '',
            latitude: null,
            longitude: null,
            gowthra: ''
          } 
        };
        fetchUsers();
      } catch (error) {
        alert(error.message || 'Failed to create user');
      }
    };

    const handleDelete = async (id) => {
      if (confirm('Are you sure you want to delete this user?')) {
        try {
          await api.deleteClientUser(id);
          fetchUsers();
        } catch (error) {
          alert(error.message || 'Failed to delete user');
        }
      }
    };

    const viewUserDetails = async (user) => {
      selectedUser.value = user;
      showDetailsModal.value = true;
      loadingDetails.value = true;
      userDetails.value = null;

      try {
        const response = await api.getUserCompleteDetails(user._id);
        userDetails.value = response.data;
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        alert('Failed to load user details: ' + error.message);
      } finally {
        loadingDetails.value = false;
      }
    };

    const closeDetailsModal = () => {
      showDetailsModal.value = false;
      selectedUser.value = null;
      userDetails.value = null;
    };

    const updateProfile = (field, value) => {
      newUser.value.profile[field] = value;
    };

    onMounted(() => {
      fetchUsers();
    });

    return () => (
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h1 class="card-title mb-0">Users</h1>
            <button onClick={() => showCreateModal.value = true} class="btn btn-primary">Add User</button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-light">
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Place of Birth</th>
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
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span class={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => viewUserDetails(user)} 
                        class="btn btn-info btn-sm me-2"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleDelete(user._id)} 
                        class="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Create User Modal */}
          {showCreateModal.value && (
            <div 
              class="modal show d-block" 
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => showCreateModal.value = false}
            >
              <div class="modal-dialog modal-dialog-scrollable modal-lg" onClick={(e) => e.stopPropagation()}>
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Create User</h5>
                    <button type="button" class="btn-close" onClick={() => showCreateModal.value = false}></button>
                  </div>
                  <form onSubmit={handleCreate}>
                    <div class="modal-body">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Email *</label>
                          <input
                            value={newUser.value.email}
                            onInput={(e) => newUser.value.email = e.target.value}
                            type="email"
                            class="form-control"
                            required
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Password *</label>
                          <input
                            value={newUser.value.password}
                            onInput={(e) => newUser.value.password = e.target.value}
                            type="password"
                            class="form-control"
                            required
                            minLength={6}
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Name</label>
                          <input
                            value={newUser.value.profile.name}
                            onInput={(e) => updateProfile('name', e.target.value)}
                            type="text"
                            class="form-control"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Date of Birth</label>
                          <input
                            value={newUser.value.profile.dob}
                            onInput={(e) => updateProfile('dob', e.target.value)}
                            type="date"
                            class="form-control"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Time of Birth (HH:MM)</label>
                          <input
                            value={newUser.value.profile.timeOfBirth}
                            onInput={(e) => updateProfile('timeOfBirth', e.target.value)}
                            type="time"
                            class="form-control"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Place of Birth</label>
                          <input
                            value={newUser.value.profile.placeOfBirth}
                            onInput={(e) => updateProfile('placeOfBirth', e.target.value)}
                            type="text"
                            class="form-control"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Latitude</label>
                          <input
                            value={newUser.value.profile.latitude}
                            onInput={(e) => updateProfile('latitude', parseFloat(e.target.value))}
                            type="number"
                            step="0.0001"
                            class="form-control"
                            placeholder="e.g., 19.20"
                          />
                        </div>
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Longitude</label>
                          <input
                            value={newUser.value.profile.longitude}
                            onInput={(e) => updateProfile('longitude', parseFloat(e.target.value))}
                            type="number"
                            step="0.0001"
                            class="form-control"
                            placeholder="e.g., 25.2"
                          />
                        </div>
                        <div class="col-md-12 mb-3">
                          <label class="form-label">Gowthra</label>
                          <input
                            value={newUser.value.profile.gowthra}
                            onInput={(e) => updateProfile('gowthra', e.target.value)}
                            type="text"
                            class="form-control"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-secondary" onClick={() => showCreateModal.value = false}>Cancel</button>
                      <button type="submit" class="btn btn-primary">Create</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* User Details Modal */}
          {showDetailsModal.value && (
            <div 
              class="modal show d-block" 
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={closeDetailsModal}
            >
              <div class="modal-dialog modal-xl modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">User Complete Details</h5>
                    <button type="button" class="btn-close" onClick={closeDetailsModal}></button>
                  </div>
                  <div class="modal-body">
                    {loadingDetails.value ? (
                      <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading user details and astrology data...</p>
                      </div>
                    ) : userDetails.value ? (
                      <div>
                        {/* User Basic Info */}
                        <div class="card mb-3">
                          <div class="card-header bg-primary text-white">
                            <h6 class="mb-0">Basic Information</h6>
                          </div>
                          <div class="card-body">
                            <div class="row">
                              <div class="col-md-6">
                                <p><strong>Name:</strong> {userDetails.value.user.profile?.name || 'N/A'}</p>
                                <p><strong>Email:</strong> {userDetails.value.user.email}</p>
                                <p><strong>Mobile:</strong> {userDetails.value.user.mobile || 'N/A'}</p>
                              </div>
                              <div class="col-md-6">
                                <p><strong>DOB:</strong> {userDetails.value.user.profile?.dob ? new Date(userDetails.value.user.profile.dob).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Time of Birth:</strong> {userDetails.value.user.profile?.timeOfBirth || 'N/A'}</p>
                                <p><strong>Place of Birth:</strong> {userDetails.value.user.profile?.placeOfBirth || 'N/A'}</p>
                                <p><strong>Gowthra:</strong> {userDetails.value.user.profile?.gowthra || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Astrology Data */}
                        {userDetails.value.astrology ? (
                          <>
                            {/* Birth Details */}
                            <div class="card mb-3">
                              <div class="card-header bg-info text-white">
                                <h6 class="mb-0">Birth Details</h6>
                              </div>
                              <div class="card-body">
                                <pre class="mb-0" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                  {JSON.stringify(userDetails.value.astrology.birthDetails, null, 2)}
                                </pre>
                              </div>
                            </div>

                            {/* Astro Details */}
                            <div class="card mb-3">
                              <div class="card-header bg-success text-white">
                                <h6 class="mb-0">Astrological Details</h6>
                              </div>
                              <div class="card-body">
                                <pre class="mb-0" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                  {JSON.stringify(userDetails.value.astrology.astroDetails, null, 2)}
                                </pre>
                              </div>
                            </div>

                            {/* Planets */}
                            <div class="card mb-3">
                              <div class="card-header bg-warning text-dark">
                                <h6 class="mb-0">Planets</h6>
                              </div>
                              <div class="card-body">
                                <pre class="mb-0" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                  {JSON.stringify(userDetails.value.astrology.planets, null, 2)}
                                </pre>
                              </div>
                            </div>

                            {/* Planets Extended */}
                            <div class="card mb-3">
                              <div class="card-header bg-danger text-white">
                                <h6 class="mb-0">Planets Extended</h6>
                              </div>
                              <div class="card-body">
                                <pre class="mb-0" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                  {JSON.stringify(userDetails.value.astrology.planetsExtended, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div class="alert alert-warning">
                            <strong>Astrology Data Not Available</strong>
                            <p class="mb-0">{userDetails.value.astrologyError || 'No astrology data found'}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div class="alert alert-danger">
                        Failed to load user details
                      </div>
                    )}
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onClick={closeDetailsModal}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
};