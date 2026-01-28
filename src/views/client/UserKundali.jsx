import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../services/api.js';
import BirthDetails from '../../components/kundali/BirthDetails.jsx';
import AstroDetails from '../../components/kundali/AstroDetails.jsx';
import PlanetaryPosition from '../../components/kundali/PlanetaryPosition.jsx';
import BirthChart from '../../components/kundali/BirthChart.jsx';
import SkeletonLoader from '../../components/kundali/SkeletonLoader.jsx';

export default {
  name: 'UserKundali',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userId = route.params.userId;
    
    const userDetails = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const activeTab = ref('overview');

  // Remove debug logs and revert to clean version
    const fetchUserDetails = async () => {
      try {
        loading.value = true;
        const response = await api.getUserCompleteDetails(userId);
        userDetails.value = response.data;
      } catch (err) {
        console.error('Failed to fetch user details:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.back();
    };

    const tabs = [
      { 
        id: 'overview', 
        label: 'Overview', 
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/></svg>, 
        color: '#007bff' 
      },
      { 
        id: 'birth-details', 
        label: 'Birth Details', 
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, 
        color: '#17a2b8' 
      },
      { 
        id: 'astro-details', 
        label: 'Astrological', 
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>, 
        color: '#ffc107' 
      },
      { 
        id: 'planets', 
        label: 'Planets', 
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, 
        color: '#6f42c1' 
      },
      { 
        id: 'charts', 
        label: 'Charts', 
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, 
        color: '#28a745' 
      }
    ];

    onMounted(() => {
      fetchUserDetails();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        {loading.value ? (
          <div class="text-center py-5">
            <div class="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted">Loading kundali data...</p>
          </div>
        ) : error.value ? (
          <div class="text-center py-5">
            <div class="mb-4 p-4 rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
              <span style={{ fontSize: '4rem' }}>⚠️</span>
            </div>
            <h4 class="text-muted mb-3">Oops! Something went wrong</h4>
            <p class="text-muted mb-4">{error.value}</p>
            <button class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm" onClick={goBack} style={{ fontWeight: '600' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Go Back
            </button>
          </div>
        ) : userDetails.value ? (
          <div>
            {/* Enhanced Hero Header */}
            <div class="bg-gradient-primary rounded-4 p-3 mb-3 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
                <button 
                  class="btn btn-light btn-md rounded-pill px-3 py-2" 
                  onClick={goBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '100px', fontSize: '0.95rem', fontWeight: '600' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  <span>Back</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-3 d-flex align-items-center" style={{ color: '#000000', lineHeight: '1.2' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" class="me-2" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/>
                      <polygon points="10,8 16,12 10,16 10,8"/>
                    </svg>
                    <span>Kundali Analysis</span>
                  </h1>
                  {userDetails.value.user && (
                    <>
                      <p class="mb-1" style={{ color: '#000000', fontSize: '1rem', fontWeight: '600', lineHeight: '1.3' }}>
                        <strong>{userDetails.value.user.profile?.name || userDetails.value.user.email}</strong>
                        {userDetails.value.user.profile?.dob && (
                          <span class="ms-2">• Born: {new Date(userDetails.value.user.profile.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        )}
                      </p>
                      <div class="d-flex flex-wrap gap-2" style={{ color: '#000000', fontWeight: '600', fontSize: '0.9rem' }}>
                        {userDetails.value.user.profile?.placeOfBirth && (
                          <div class="d-flex align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '15px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" class="me-1" style={{ flexShrink: 0 }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <span>{userDetails.value.user.profile.placeOfBirth}</span>
                          </div>
                        )}
                        {userDetails.value.user.profile?.timeOfBirth && (
                          <div class="d-flex align-items-center" style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '15px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" class="me-1" style={{ flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                            <span>{userDetails.value.user.profile.timeOfBirth}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div class="d-flex align-items-center">
                  <span class="badge bg-light text-dark px-2 py-1 rounded-pill fw-semibold d-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                    <span>Premium</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Tab Navigation */}
            <div class="card border-0 shadow-lg rounded-4 mb-3">
              <div class="card-header bg-white border-0 rounded-top-4 p-0">
                <ul class="nav nav-pills nav-fill p-2" style={{ gap: '0.5rem' }}>
                  {tabs.map(tab => (
                    <li key={tab.id} class="nav-item">
                      <button
                        class={`nav-link rounded-pill px-3 py-2 fw-semibold border-0 d-flex align-items-center justify-content-center gap-1 ${
                          activeTab.value === tab.id 
                            ? 'active text-white shadow-sm' 
                            : 'text-dark bg-light'
                        }`}
                        onClick={() => activeTab.value = tab.id}
                        style={{
                          transition: 'all 0.3s ease',
                          fontSize: '0.85rem',
                          backgroundColor: activeTab.value === tab.id ? tab.color : undefined,
                          transform: activeTab.value === tab.id ? 'translateY(-1px)' : 'none',
                          minHeight: '40px'
                        }}
                      >
                        <span class="d-none d-md-flex align-items-center gap-1">
                          {tab.icon}
                          <span>{tab.label}</span>
                        </span>
                        <span class="d-md-none d-flex align-items-center justify-content-center">
                          {tab.icon}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Enhanced Tab Content */}
            <div class="tab-content">
              {activeTab.value === 'overview' && (
                <div class="row g-4">
                  <div class="col-lg-6">
                    <div class="card border-0 shadow-lg rounded-4 h-100">
                      <div class="card-header bg-primary text-white rounded-top-4 p-4">
                        <h5 class="mb-0 fw-bold d-flex align-items-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          Personal Information
                        </h5>
                      </div>
                      <div class="card-body p-4">
                        {userDetails.value.user ? (
                          <div class="row g-3">
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Name</small>
                                <strong class="text-dark">{userDetails.value.user.profile?.name || 'N/A'}</strong>
                              </div>
                            </div>
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Email</small>
                                <strong class="text-dark">{userDetails.value.user.email}</strong>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Date of Birth</small>
                                <strong class="text-dark">{userDetails.value.user.profile?.dob ? new Date(userDetails.value.user.profile.dob).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : 'N/A'}</strong>
                              </div>
                            </div>
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Time of Birth</small>
                                <strong class="text-dark">{userDetails.value.user.profile?.timeOfBirth || 'N/A'}</strong>
                              </div>
                            </div>
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Place of Birth</small>
                                <strong class="text-dark">{userDetails.value.user.profile?.placeOfBirth || 'N/A'}</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div class="text-center py-4">
                            <div class="spinner-border text-primary mb-2" role="status">
                              <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="text-muted mb-0">Loading personal information...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="card border-0 shadow-lg rounded-4 h-100">
                      <div class="card-header bg-success text-white rounded-top-4 p-4">
                        <h5 class="mb-0 fw-bold d-flex align-items-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                          </svg>
                          Quick Astrological Info
                        </h5>
                      </div>
                      <div class="card-body p-4">
                        {userDetails.value.astrology ? (
                          <div class="row g-3">
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Ascendant</small>
                                <strong class="text-dark">{userDetails.value.astrology.astroDetails?.ascendant || 'N/A'}</strong>
                              </div>
                            </div>
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Moon Sign</small>
                                <strong class="text-dark">{userDetails.value.astrology.astroDetails?.sign || 'N/A'}</strong>
                              </div>
                            </div>
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Nakshatra</small>
                                <strong class="text-dark">{userDetails.value.astrology.astroDetails?.nakshatra || 'N/A'}</strong>
                              </div>
                            </div>
                            <div class="col-6">
                              <div class="p-3 rounded-3 border" style={{ backgroundColor: '#f8f9fa', borderColor: '#e9ecef !important' }}>
                                <small class="text-muted d-block mb-1">Gowthra</small>
                                <strong class="text-dark">{userDetails.value.user.profile?.gowthra || 'N/A'}</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div class="text-center py-4">
                            <div class="mb-3">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="text-warning">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                <path d="M12 9v4"/>
                                <path d="m12 17 .01 0"/>
                              </svg>
                            </div>
                            <h6 class="text-muted mb-2">Astrology Data Unavailable</h6>
                            <p class="text-muted mb-0 small">Complete birth details required for astrology calculations</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab.value === 'birth-details' && (
                <div class="card border-0 shadow-lg rounded-4">
                  <div class="card-header bg-info text-white rounded-top-4 p-4">
                    <h5 class="mb-0 fw-bold d-flex align-items-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Complete Birth Details
                    </h5>
                  </div>
                  <div class="card-body p-4">
                    {userDetails.value.astrology ? (
                      <BirthDetails data={userDetails.value.astrology} />
                    ) : (
                      <div class="text-center py-5">
                        <div class="mb-3" style={{ fontSize: '4rem' }}>📋</div>
                        <h5 class="text-muted mb-3">Birth Details Not Available</h5>
                        <p class="text-muted">Complete birth information is required to display detailed birth analysis.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab.value === 'astro-details' && (
                <div class="row g-4">
                  <div class="col-12">
                    <div class="card border-0 shadow-lg rounded-4">
                      <div class="card-header bg-warning text-dark rounded-top-4 p-4">
                        <h5 class="mb-0 fw-bold d-flex align-items-center">
                          <span class="me-2" style={{ fontSize: '1.5rem' }}>⭐</span>
                          Astrological Analysis
                        </h5>
                      </div>
                      <div class="card-body p-4">
                        {userDetails.value.astrology ? (
                          <AstroDetails data={userDetails.value.astrology} />
                        ) : (
                          <div class="text-center py-5">
                            <div class="spinner-border text-warning mb-3" role="status">
                              <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="text-muted">Loading astrological data...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab.value === 'planets' && (
                <div class="row g-4">
                  <div class="col-12">
                    <div class="card border-0 shadow-lg rounded-4">
                      <div class="card-header bg-secondary text-white rounded-top-4 p-4">
                        <h5 class="mb-0 fw-bold d-flex align-items-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                          </svg>
                          Planetary Positions
                        </h5>
                      </div>
                      <div class="card-body p-4">
                        {userDetails.value.astrology ? (
                          <PlanetaryPosition data={userDetails.value.astrology} />
                        ) : (
                          <div class="text-center py-5">
                            <div class="spinner-border mb-3" role="status" style={{ color: '#6f42c1' }}>
                              <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="text-muted">Loading planetary data...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab.value === 'charts' && (
                <div class="row g-4">
                  <div class="col-12">
                    <div class="card border-0 shadow-lg rounded-4">
                      <div class="card-header bg-dark text-white rounded-top-4 p-4">
                        <h5 class="mb-0 fw-bold d-flex align-items-center">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                            <line x1="18" y1="20" x2="18" y2="10"/>
                            <line x1="12" y1="20" x2="12" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="14"/>
                          </svg>
                          Birth Charts
                        </h5>
                      </div>
                      <div class="card-body p-4">
                        {userDetails.value.astrology ? (
                          <BirthChart data={userDetails.value.astrology} />
                        ) : (
                          <div class="text-center py-5">
                            <div class="spinner-border text-success mb-3" role="status">
                              <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="text-muted">Loading birth charts...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
};