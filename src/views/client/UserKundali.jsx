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
      { id: 'overview', label: 'Overview', icon: '📊', color: '#007bff' },
      { id: 'birth-details', label: 'Birth Details', icon: '👤', color: '#17a2b8' },
      { id: 'astro-details', label: 'Astrological', icon: '⭐', color: '#ffc107' },
      { id: 'planets', label: 'Planets', icon: '🪐', color: '#6f42c1' },
      { id: 'charts', label: 'Charts', icon: '📈', color: '#28a745' }
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
            <div class="bg-gradient-primary rounded-4 p-4 mb-4 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3" 
                  onClick={goBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                  <span class="d-none d-sm-inline">Back</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2 text-white d-flex align-items-center">
                    <span class="me-3" style={{ fontSize: '2.5rem' }}>🔮</span>
                    Kundali Analysis
                  </h1>
                  {userDetails.value.user && (
                    <>
                      <p class="mb-0 text-white" style={{ opacity: 0.9, fontSize: '1.1rem' }}>
                        <strong>{userDetails.value.user.profile?.name || userDetails.value.user.email}</strong>
                        {userDetails.value.user.profile?.dob && (
                          <span> • Born: {new Date(userDetails.value.user.profile.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        )}
                      </p>
                      <small class="text-white d-block mt-1" style={{ opacity: 0.8 }}>
                        {userDetails.value.user.profile?.placeOfBirth && (
                          <span>📍 {userDetails.value.user.profile.placeOfBirth}</span>
                        )}
                        {userDetails.value.user.profile?.timeOfBirth && (
                          <span> • ⏰ {userDetails.value.user.profile.timeOfBirth}</span>
                        )}
                      </small>
                    </>
                  )}
                </div>
                <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-light text-dark px-3 py-2 rounded-pill fw-semibold">
                    ✨ Premium Analysis
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Tab Navigation */}
            <div class="card border-0 shadow-lg rounded-4 mb-4">
              <div class="card-header bg-white border-0 rounded-top-4 p-0">
                <ul class="nav nav-pills nav-fill p-3" style={{ gap: '0.5rem' }}>
                  {tabs.map(tab => (
                    <li key={tab.id} class="nav-item">
                      <button
                        class={`nav-link rounded-pill px-4 py-3 fw-semibold border-0 ${
                          activeTab.value === tab.id 
                            ? 'active text-white shadow-sm' 
                            : 'text-dark bg-light'
                        }`}
                        onClick={() => activeTab.value = tab.id}
                        style={{
                          transition: 'all 0.3s ease',
                          fontSize: '0.9rem',
                          backgroundColor: activeTab.value === tab.id ? tab.color : undefined,
                          transform: activeTab.value === tab.id ? 'translateY(-2px)' : 'none'
                        }}
                      >
                        <span class="d-none d-md-inline">{tab.icon} {tab.label}</span>
                        <span class="d-md-none" style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
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
                          <span class="me-2" style={{ fontSize: '1.5rem' }}>👤</span>
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
                          <span class="me-2" style={{ fontSize: '1.5rem' }}>⭐</span>
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
                            <div class="mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
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
                      <span class="me-2" style={{ fontSize: '1.5rem' }}>👤</span>
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
                          <span class="me-2" style={{ fontSize: '1.5rem' }}>🪐</span>
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
                          <span class="me-2" style={{ fontSize: '1.5rem' }}>📈</span>
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