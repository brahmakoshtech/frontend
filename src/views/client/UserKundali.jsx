// frontend/src/views/client/UserKundali.jsx

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'UserKundali',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userId = route.params.userId;
    
    const userDetails = ref(null);
    const loading = ref(true);
    const error = ref(null);

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

    onMounted(() => {
      fetchUserDetails();
    });

    return () => (
      <div class="container-fluid py-4">
        {loading.value ? (
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading Kundali details...</p>
          </div>
        ) : error.value ? (
          <div class="alert alert-danger">
            <h5>Error Loading Kundali</h5>
            <p>{error.value}</p>
            <button onClick={goBack} class="btn btn-secondary">Go Back</button>
          </div>
        ) : userDetails.value ? (
          <div>
            {/* Header */}
            <div class="row mb-4">
              <div class="col-12">
                <div class="card border-0 shadow-sm">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 class="mb-1">🌟 Kundali Report</h2>
                        <h4 class="text-primary mb-0">{userDetails.value.user.profile?.name || 'Unknown'}</h4>
                      </div>
                      <button onClick={goBack} class="btn btn-outline-secondary">
                        <i class="fas fa-arrow-left me-2"></i>Back to Users
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div class="row mb-4">
              <div class="col-12">
                <div class="card border-0 shadow-sm">
                  <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="fas fa-user me-2"></i>Personal Information</h5>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <table class="table table-borderless">
                          <tr><td><strong>Name:</strong></td><td>{userDetails.value.user.profile?.name || 'N/A'}</td></tr>
                          <tr><td><strong>Email:</strong></td><td>{userDetails.value.user.email}</td></tr>
                          <tr><td><strong>Mobile:</strong></td><td>{userDetails.value.user.mobile || 'N/A'}</td></tr>
                        </table>
                      </div>
                      <div class="col-md-6">
                        <table class="table table-borderless">
                          <tr><td><strong>Date of Birth:</strong></td><td>{userDetails.value.user.profile?.dob ? new Date(userDetails.value.user.profile.dob).toLocaleDateString() : 'N/A'}</td></tr>
                          <tr><td><strong>Time of Birth:</strong></td><td>{userDetails.value.user.profile?.timeOfBirth || 'N/A'}</td></tr>
                          <tr><td><strong>Place of Birth:</strong></td><td>{userDetails.value.user.profile?.placeOfBirth || 'N/A'}</td></tr>
                          <tr><td><strong>Gowthra:</strong></td><td>{userDetails.value.user.profile?.gowthra || 'N/A'}</td></tr>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kundali Content */}
            {userDetails.value.astrology ? (
              <>
                {/* Birth Chart Section */}
                <div class="row mb-4">
                  <div class="col-12">
                    <div class="card border-0 shadow-sm">
                      <div class="card-header bg-gradient-info text-white">
                        <h5 class="mb-0"><i class="fas fa-star me-2"></i>Birth Chart Details</h5>
                      </div>
                      <div class="card-body">
                        <div class="row">
                          <div class="col-lg-6">
                            <h6 class="text-info mb-3">Birth Coordinates</h6>
                            <div class="table-responsive">
                              <table class="table table-sm">
                                <tr><td><strong>Date:</strong></td><td>{userDetails.value.astrology.birthDetails.day}/{userDetails.value.astrology.birthDetails.month}/{userDetails.value.astrology.birthDetails.year}</td></tr>
                                <tr><td><strong>Time:</strong></td><td>{userDetails.value.astrology.birthDetails.hour}:{userDetails.value.astrology.birthDetails.minute.toString().padStart(2, '0')}</td></tr>
                                <tr><td><strong>Latitude:</strong></td><td>{userDetails.value.astrology.birthDetails.latitude}°</td></tr>
                                <tr><td><strong>Longitude:</strong></td><td>{userDetails.value.astrology.birthDetails.longitude}°</td></tr>
                                <tr><td><strong>Ayanamsha:</strong></td><td>{userDetails.value.astrology.birthDetails.ayanamsha}°</td></tr>
                                <tr><td><strong>Sunrise:</strong></td><td>{userDetails.value.astrology.birthDetails.sunrise}</td></tr>
                                <tr><td><strong>Sunset:</strong></td><td>{userDetails.value.astrology.birthDetails.sunset}</td></tr>
                              </table>
                            </div>
                          </div>
                          <div class="col-lg-6">
                            <h6 class="text-success mb-3">Astrological Details</h6>
                            <div class="table-responsive">
                              <table class="table table-sm">
                                <tr><td><strong>Ascendant:</strong></td><td><span class="badge bg-primary fs-6">{userDetails.value.astrology.astroDetails.ascendant}</span></td></tr>
                                <tr><td><strong>Moon Sign:</strong></td><td><span class="badge bg-info fs-6">{userDetails.value.astrology.astroDetails.sign}</span></td></tr>
                                <tr><td><strong>Sign Lord:</strong></td><td>{userDetails.value.astrology.astroDetails.SignLord}</td></tr>
                                <tr><td><strong>Nakshatra:</strong></td><td><span class="badge bg-warning text-dark fs-6">{userDetails.value.astrology.astroDetails.Naksahtra}</span></td></tr>
                                <tr><td><strong>Nakshatra Lord:</strong></td><td>{userDetails.value.astrology.astroDetails.NaksahtraLord}</td></tr>
                                <tr><td><strong>Charan:</strong></td><td>{userDetails.value.astrology.astroDetails.Charan}</td></tr>
                                <tr><td><strong>Varna:</strong></td><td>{userDetails.value.astrology.astroDetails.Varna}</td></tr>
                                <tr><td><strong>Gan:</strong></td><td>{userDetails.value.astrology.astroDetails.Gan}</td></tr>
                                <tr><td><strong>Yoni:</strong></td><td>{userDetails.value.astrology.astroDetails.Yoni}</td></tr>
                                <tr><td><strong>Nadi:</strong></td><td>{userDetails.value.astrology.astroDetails.Nadi}</td></tr>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planetary Positions */}
                <div class="row mb-4">
                  <div class="col-12">
                    <div class="card border-0 shadow-sm">
                      <div class="card-header bg-gradient-warning text-dark">
                        <h5 class="mb-0"><i class="fas fa-globe me-2"></i>Planetary Positions</h5>
                      </div>
                      <div class="card-body">
                        <div class="row">
                          {userDetails.value.astrology.planets.map(planet => (
                            <div key={planet.id} class="col-md-6 col-lg-4 col-xl-3 mb-4">
                              <div class="card border-0 shadow-sm h-100 planet-card">
                                <div class="card-body text-center">
                                  <div class="planet-icon mb-2">
                                    <i class="fas fa-circle text-primary fa-2x"></i>
                                  </div>
                                  <h6 class="card-title text-primary mb-2">{planet.name}</h6>
                                  <div class="mb-2">
                                    <span class="badge bg-light text-dark">{planet.sign}</span>
                                    {planet.isRetro === 'true' && <span class="badge bg-danger ms-1">R</span>}
                                  </div>
                                  <div class="planet-details">
                                    <small class="text-muted d-block">House: <strong>{planet.house}</strong></small>
                                    <small class="text-muted d-block">Degree: <strong>{planet.normDegree.toFixed(2)}°</strong></small>
                                    <small class="text-muted d-block">Nakshatra: <strong>{planet.nakshatra}</strong></small>
                                    <small class="text-success d-block mt-1"><strong>{planet.planet_awastha}</strong></small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shadow Planets */}
                <div class="row mb-4">
                  <div class="col-12">
                    <div class="card border-0 shadow-sm">
                      <div class="card-header bg-gradient-danger text-white">
                        <h5 class="mb-0"><i class="fas fa-moon me-2"></i>Shadow Planets (Rahu & Ketu)</h5>
                      </div>
                      <div class="card-body">
                        <div class="row justify-content-center">
                          {userDetails.value.astrology.planetsExtended.map(planet => (
                            <div key={planet.id} class="col-md-6 col-lg-4 mb-4">
                              <div class="card border-0 shadow-sm h-100 shadow-planet-card">
                                <div class="card-body text-center">
                                  <div class="planet-icon mb-2">
                                    <i class="fas fa-moon text-danger fa-2x"></i>
                                  </div>
                                  <h6 class="card-title text-danger mb-2">{planet.name}</h6>
                                  <div class="mb-2">
                                    <span class="badge bg-light text-dark">{planet.sign}</span>
                                    <span class="badge bg-warning ms-1">R</span>
                                  </div>
                                  <div class="planet-details">
                                    <small class="text-muted d-block">House: <strong>{planet.house}</strong></small>
                                    <small class="text-muted d-block">Degree: <strong>{planet.normDegree.toFixed(2)}°</strong></small>
                                    <small class="text-muted d-block">Nakshatra: <strong>{planet.nakshatra}</strong></small>
                                    <small class="text-success d-block mt-1"><strong>{planet.planet_awastha}</strong></small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Birth Chart Visualization */}
                <div class="row mb-4">
                  <div class="col-12">
                    <div class="card border-0 shadow-sm">
                      <div class="card-header bg-gradient-secondary text-white">
                        <h5 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Birth Chart Visualization</h5>
                      </div>
                      <div class="card-body">
                        <div class="row">
                          <div class="col-lg-6 mb-4">
                            <h6 class="text-center mb-3">North Indian Chart</h6>
                            <div class="chart-container border rounded p-4 text-center" style={{ height: '400px', backgroundColor: '#f8f9fa' }}>
                              <div class="d-flex align-items-center justify-content-center h-100">
                                <div class="text-muted">
                                  <i class="fas fa-chart-area fa-4x mb-3"></i>
                                  <h6>North Indian Chart</h6>
                                  <p>Chart visualization will be implemented here</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div class="col-lg-6 mb-4">
                            <h6 class="text-center mb-3">South Indian Chart</h6>
                            <div class="chart-container border rounded p-4 text-center" style={{ height: '400px', backgroundColor: '#f8f9fa' }}>
                              <div class="d-flex align-items-center justify-content-center h-100">
                                <div class="text-muted">
                                  <i class="fas fa-th fa-4x mb-3"></i>
                                  <h6>South Indian Chart</h6>
                                  <p>Chart visualization will be implemented here</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div class="row">
                <div class="col-12">
                  <div class="alert alert-warning">
                    <div class="d-flex align-items-center">
                      <i class="fas fa-exclamation-triangle fa-3x me-4"></i>
                      <div>
                        <h4 class="alert-heading">Astrology Data Not Available</h4>
                        <p class="mb-0">{userDetails.value.astrologyError || 'Complete birth details required for astrology calculations'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        <style jsx>{`
          .planet-card:hover {
            transform: translateY(-5px);
            transition: all 0.3s ease;
          }
          
          .shadow-planet-card:hover {
            transform: translateY(-5px);
            transition: all 0.3s ease;
          }
          
          .chart-container {
            border: 2px dashed #dee2e6 !important;
          }
          
          .planet-details small {
            line-height: 1.4;
          }
          
          .bg-gradient-primary {
            background: linear-gradient(45deg, #007bff, #0056b3);
          }
          
          .bg-gradient-info {
            background: linear-gradient(45deg, #17a2b8, #138496);
          }
          
          .bg-gradient-warning {
            background: linear-gradient(45deg, #ffc107, #e0a800);
          }
          
          .bg-gradient-danger {
            background: linear-gradient(45deg, #dc3545, #c82333);
          }
          
          .bg-gradient-secondary {
            background: linear-gradient(45deg, #6c757d, #5a6268);
          }
        `}</style>
      </div>
    );
  }
};