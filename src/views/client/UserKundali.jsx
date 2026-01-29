// UserKundali.jsx - Enhanced with comprehensive console logging for debugging
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../services/api.js';
import BirthDetails from '../../components/kundali/BirthDetails.jsx';
import AstroDetails from '../../components/kundali/AstroDetails.jsx';
import PlanetaryPosition from '../../components/kundali/PlanetaryPosition.jsx';
import BirthChart from '../../components/kundali/BirthChart.jsx';
import PanchangView from '../../components/kundali/PanchangView.jsx';
import NumerologyView from '../../components/kundali/NumerologyView.jsx';
import SkeletonLoader from '../../components/kundali/SkeletonLoader.jsx';

export default {
  name: 'UserKundali',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userId = route.params.id;
    
    const userDetails = ref(null);
    const panchangData = ref(null);
    const numerologyData = ref(null);
    const loading = ref(true);
    const panchangLoading = ref(false);
    const numerologyLoading = ref(false);
    const error = ref(null);
    const activeTab = ref('overview');

    // Panchang state
    const showPanchangForm = ref(false);
    const panchangLocation = ref({
      latitude: null,
      longitude: null
    });

    // Numerology state
    const showNumerologyForm = ref(false);
    const numerologyDate = ref('');
    const numerologyName = ref('');

    // 🔍 DEBUGGING HELPER: Log data structure
    const logDataStructure = (obj, name, indent = 0) => {
      const spaces = '  '.repeat(indent);
      console.log(`${spaces}${name}:`, typeof obj);
      
      if (obj === null || obj === undefined) {
        console.log(`${spaces}  → Value: ${obj}`);
        return;
      }

      if (Array.isArray(obj)) {
        console.log(`${spaces}  → Array length: ${obj.length}`);
        if (obj.length > 0) {
          console.log(`${spaces}  → First item:`, obj[0]);
        }
      } else if (typeof obj === 'object') {
        const keys = Object.keys(obj);
        console.log(`${spaces}  → Keys (${keys.length}):`, keys.slice(0, 10));
        if (keys.length > 10) {
          console.log(`${spaces}  → ... and ${keys.length - 10} more keys`);
        }
      } else {
        console.log(`${spaces}  → Value:`, obj);
      }
    };

    const fetchUserDetails = async () => {
      try {
        loading.value = true;
        
        console.group('🚀 FETCHING USER DETAILS');
        console.log('User ID:', userId);
        console.log('API Call: getUserCompleteDetails');
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();

        const response = await api.getUserCompleteDetails(userId);
        
        console.group('📦 API RESPONSE RECEIVED');
        console.log('Full Response:', response);
        console.log('Response Data:', response.data);
        console.groupEnd();

        // 🔍 DETAILED DATA STRUCTURE LOGGING
        console.group('🔍 DETAILED DATA STRUCTURE ANALYSIS');
        
        if (response.data) {
          logDataStructure(response.data, 'response.data', 0);
          
          // User data
          if (response.data.user) {
            console.group('👤 USER DATA');
            console.log('User Object:', response.data.user);
            logDataStructure(response.data.user, 'user', 1);
            
            if (response.data.user.profile) {
              console.log('Profile:', response.data.user.profile);
              logDataStructure(response.data.user.profile, 'user.profile', 2);
            }
            console.groupEnd();
          } else {
            console.warn('⚠️ No user data found in response');
          }

          // Astrology data
          if (response.data.astrology) {
            console.group('⭐ ASTROLOGY DATA');
            console.log('Astrology Object:', response.data.astrology);
            logDataStructure(response.data.astrology, 'astrology', 1);

            // Birth Details
            if (response.data.astrology.birthDetails) {
              console.group('📅 Birth Details');
              console.log('Full Object:', response.data.astrology.birthDetails);
              console.table(response.data.astrology.birthDetails);
              console.groupEnd();
            } else {
              console.warn('⚠️ No birthDetails found');
            }

            // Astro Details
            if (response.data.astrology.astroDetails) {
              console.group('🌟 Astro Details');
              console.log('Full Object:', response.data.astrology.astroDetails);
              console.table(response.data.astrology.astroDetails);
              console.groupEnd();
            } else {
              console.warn('⚠️ No astroDetails found');
            }

            // Planets
            if (response.data.astrology.planets) {
              console.group('🪐 PLANETS DATA');
              console.log('Planets Type:', typeof response.data.astrology.planets);
              console.log('Is Array:', Array.isArray(response.data.astrology.planets));
              console.log('Length/Keys:', Array.isArray(response.data.astrology.planets) 
                ? response.data.astrology.planets.length 
                : Object.keys(response.data.astrology.planets).length);
              console.log('Full Planets Data:', response.data.astrology.planets);
              
              if (Array.isArray(response.data.astrology.planets) && response.data.astrology.planets.length > 0) {
                console.log('First Planet Sample:', response.data.astrology.planets[0]);
                console.table(response.data.astrology.planets);
              }
              console.groupEnd();
            } else {
              console.warn('⚠️ No planets data found');
            }

            // Extended Planets
            if (response.data.astrology.planetsExtended) {
              console.group('🌑 EXTENDED PLANETS DATA');
              console.log('Extended Planets Type:', typeof response.data.astrology.planetsExtended);
              console.log('Is Array:', Array.isArray(response.data.astrology.planetsExtended));
              console.log('Length/Keys:', Array.isArray(response.data.astrology.planetsExtended) 
                ? response.data.astrology.planetsExtended.length 
                : Object.keys(response.data.astrology.planetsExtended).length);
              console.log('Full Extended Planets Data:', response.data.astrology.planetsExtended);
              
              if (Array.isArray(response.data.astrology.planetsExtended) && response.data.astrology.planetsExtended.length > 0) {
                console.log('First Extended Planet Sample:', response.data.astrology.planetsExtended[0]);
                console.table(response.data.astrology.planetsExtended);
              }
              console.groupEnd();
            } else {
              console.warn('⚠️ No extended planets data found');
            }

            // Birth Chart
            if (response.data.astrology.birthChart) {
              console.group('📊 BIRTH CHART DATA');
              console.log('Birth Chart Type:', typeof response.data.astrology.birthChart);
              console.log('Full Birth Chart:', response.data.astrology.birthChart);
              
              if (response.data.astrology.birthChart.houses) {
                console.log('Houses Type:', typeof response.data.astrology.birthChart.houses);
                console.log('Houses Data:', response.data.astrology.birthChart.houses);
                
                if (typeof response.data.astrology.birthChart.houses === 'object') {
                  console.log('Houses Keys:', Object.keys(response.data.astrology.birthChart.houses));
                  
                  // Show sample houses
                  const houses = response.data.astrology.birthChart.houses;
                  for (let i = 1; i <= 3; i++) {
                    const house = houses[i] || houses[i.toString()];
                    console.log(`House ${i}:`, house);
                  }
                }
              } else {
                console.warn('⚠️ No houses in birth chart');
              }
              console.groupEnd();
            } else {
              console.warn('⚠️ No birth chart found');
            }

            // Extended Birth Chart
            if (response.data.astrology.birthExtendedChart) {
              console.group('📊 EXTENDED BIRTH CHART DATA');
              console.log('Extended Chart Type:', typeof response.data.astrology.birthExtendedChart);
              console.log('Full Extended Chart:', response.data.astrology.birthExtendedChart);
              
              if (response.data.astrology.birthExtendedChart.houses) {
                console.log('Extended Houses:', response.data.astrology.birthExtendedChart.houses);
              }
              console.groupEnd();
            } else {
              console.warn('⚠️ No extended birth chart found');
            }

            console.groupEnd(); // End Astrology Data
          } else {
            console.error('❌ NO ASTROLOGY DATA FOUND IN RESPONSE');
            console.log('Available keys in response.data:', Object.keys(response.data));
          }
        } else {
          console.error('❌ NO DATA IN RESPONSE');
        }
        
        console.groupEnd(); // End Detailed Analysis

        // Set the data
        userDetails.value = response.data;
        
        console.group('✅ DATA SET IN COMPONENT');
        console.log('userDetails.value:', userDetails.value);
        console.log('Has astrology:', !!userDetails.value?.astrology);
        console.log('Has planets:', !!userDetails.value?.astrology?.planets);
        console.log('Has birth chart:', !!userDetails.value?.astrology?.birthChart);
        console.groupEnd();

      } catch (err) {
        console.group('❌ ERROR FETCHING USER DETAILS');
        console.error('Error Object:', err);
        console.error('Error Message:', err.message);
        console.error('Error Stack:', err.stack);
        if (err.response) {
          console.error('Response Status:', err.response.status);
          console.error('Response Data:', err.response.data);
        }
        console.groupEnd();
        
        error.value = err.message;
      } finally {
        loading.value = false;
        console.log('✅ Loading state set to false');
      }
    };

    const getCurrentLocation = () => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (err) => {
            reject(new Error('Unable to get your location. Please enter manually.'));
          }
        );
      });
    };

    const fetchPanchangData = async () => {
      if (!panchangLocation.value.latitude || !panchangLocation.value.longitude) {
        alert('Please provide your current location');
        return;
      }

      try {
        panchangLoading.value = true;
        
        console.group('🌅 FETCHING PANCHANG DATA');
        console.log('User ID:', userId);
        console.log('Location:', panchangLocation.value);
        console.log('Current Date:', new Date().toISOString());
        console.groupEnd();

        const response = await api.post(`/client/users/${userId}/panchang`, {
          currentDate: new Date().toISOString(),
          latitude: panchangLocation.value.latitude,
          longitude: panchangLocation.value.longitude
        });
        
        console.group('📦 PANCHANG RESPONSE');
        console.log('Full Response:', response);
        console.log('Panchang Data:', response.data.data);
        console.groupEnd();

        panchangData.value = response.data.data;
        showPanchangForm.value = false;
      } catch (err) {
        console.group('❌ PANCHANG ERROR');
        console.error('Error:', err);
        console.groupEnd();
        alert('Failed to fetch panchang data: ' + err.message);
      } finally {
        panchangLoading.value = false;
      }
    };

    const fetchNumerologyData = async () => {
      if (!numerologyDate.value) {
        alert('Please provide a date for numerology analysis');
        return;
      }

      const name = numerologyName.value || userDetails.value?.user?.profile?.name || 'User';

      try {
        numerologyLoading.value = true;
        
        console.group('🔢 FETCHING NUMEROLOGY DATA');
        console.log('User ID:', userId);
        console.log('Date:', numerologyDate.value);
        console.log('Name:', name);
        console.groupEnd();

        const response = await api.post(`/client/users/${userId}/numerology`, {
          date: numerologyDate.value,
          name: name
        });
        
        console.group('📦 NUMEROLOGY RESPONSE');
        console.log('Full Response:', response);
        console.log('Numerology Data:', response.data.data);
        console.groupEnd();

        numerologyData.value = response.data.data;
        showNumerologyForm.value = false;
      } catch (err) {
        console.group('❌ NUMEROLOGY ERROR');
        console.error('Error:', err);
        console.groupEnd();
        alert('Failed to fetch numerology data: ' + err.message);
      } finally {
        numerologyLoading.value = false;
      }
    };

    const requestPanchangData = async () => {
      try {
        const location = await getCurrentLocation();
        panchangLocation.value = location;
        await fetchPanchangData();
      } catch (err) {
        // If auto-location fails, show form
        showPanchangForm.value = true;
      }
    };

    const requestNumerologyData = () => {
      // Pre-fill with user's DOB if available
      if (userDetails.value?.user?.profile?.dob) {
        const dob = new Date(userDetails.value.user.profile.dob);
        numerologyDate.value = dob.toISOString().split('T')[0];
      }
      // Pre-fill name
      numerologyName.value = userDetails.value?.user?.profile?.name || '';
      showNumerologyForm.value = true;
    };

    const goBack = () => {
      router.back();
    };

    // Watch for data changes
    watch(userDetails, (newVal) => {
      console.group('👀 USER DETAILS CHANGED');
      console.log('New Value:', newVal);
      console.log('Has Astrology:', !!newVal?.astrology);
      console.groupEnd();
    });

    watch(activeTab, (newTab) => {
      console.log('📑 Active Tab Changed:', newTab);
    });

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
      },
      { 
        id: 'panchang', 
        label: 'Panchang', 
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, 
        color: '#fd7e14' 
      },
      { 
        id: 'numerology', 
        label: 'Numerology', 
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, 
        color: '#20c997' 
      }
    ];

    onMounted(() => {
      console.log('🎬 UserKundali Component Mounted');
      console.log('User ID from route:', userId);
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
            {/* Header - keeping existing header code */}
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

            {/* Tab Navigation */}
            <div class="card border-0 shadow-lg rounded-4 mb-3">
              <div class="card-header bg-white border-0 rounded-top-4 p-0">
                <ul class="nav nav-pills nav-fill p-2" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
                  {tabs.map(tab => (
                    <li key={tab.id} class="nav-item" style={{ minWidth: '120px' }}>
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
                          minHeight: '40px',
                          width: '100%'
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

            {/* Tab Content */}
            <div class="tab-content">
              {/* Overview Tab */}
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
                                <strong class="text-dark text-truncate d-block">{userDetails.value.user.email}</strong>
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

              {/* Birth Details Tab */}
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

              {/* Astro Details Tab */}
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
                            <div class="mb-3" style={{ fontSize: '4rem' }}>⭐</div>
                            <h5 class="text-muted mb-3">Astrological Data Not Available</h5>
                            <p class="text-muted">Complete birth information is required to display astrological analysis.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Planets Tab */}
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
                            <div class="mb-3" style={{ fontSize: '4rem' }}>🪐</div>
                            <h5 class="text-muted mb-3">Planetary Data Not Available</h5>
                            <p class="text-muted">Complete birth information is required to calculate planetary positions.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Tab */}
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
                            <div class="mb-3" style={{ fontSize: '4rem' }}>📊</div>
                            <h5 class="text-muted mb-3">Birth Charts Not Available</h5>
                            <p class="text-muted">Complete birth information is required to generate birth charts.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Panchang Tab - keeping existing code */}
              {activeTab.value === 'panchang' && (
                <div class="row g-4">
                  <div class="col-12">
                    {!panchangData.value && !panchangLoading.value && (
                      <div class="card border-0 shadow-lg rounded-4 mb-4">
                        <div class="card-body p-5 text-center">
                          <div class="mb-4">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="text-warning">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                          </div>
                          <h5 class="mb-3">Get Today's Panchang</h5>
                          <p class="text-muted mb-4">View today's panchang data including tithi, nakshatra, and auspicious timings for your current location</p>
                          
                          {!showPanchangForm.value ? (
                            <button 
                              class="btn btn-primary btn-lg rounded-pill px-4" 
                              onClick={requestPanchangData}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                              </svg>
                              Get Panchang for Current Location
                            </button>
                          ) : (
                            <div class="card border shadow-sm" style={{ maxWidth: '500px', margin: '0 auto' }}>
                              <div class="card-body p-4">
                                <h6 class="mb-3">Enter Location Details</h6>
                                <div class="mb-3">
                                  <label class="form-label">Latitude</label>
                                  <input 
                                    type="number" 
                                    class="form-control" 
                                    step="0.000001"
                                    value={panchangLocation.value.latitude}
                                    onInput={(e) => panchangLocation.value.latitude = parseFloat(e.target.value)}
                                    placeholder="e.g., 19.0760"
                                  />
                                </div>
                                <div class="mb-3">
                                  <label class="form-label">Longitude</label>
                                  <input 
                                    type="number" 
                                    class="form-control" 
                                    step="0.000001"
                                    value={panchangLocation.value.longitude}
                                    onInput={(e) => panchangLocation.value.longitude = parseFloat(e.target.value)}
                                    placeholder="e.g., 72.8777"
                                  />
                                </div>
                                <div class="d-flex gap-2">
                                  <button 
                                    class="btn btn-primary flex-fill" 
                                    onClick={fetchPanchangData}
                                  >
                                    Get Panchang
                                  </button>
                                  <button 
                                    class="btn btn-secondary" 
                                    onClick={() => showPanchangForm.value = false}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {panchangLoading.value && (
                      <div class="text-center py-5">
                        <div class="spinner-border text-warning mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="text-muted">Loading panchang data...</p>
                      </div>
                    )}

                    {panchangData.value && !panchangLoading.value && (
                      <PanchangView data={panchangData.value} />
                    )}
                  </div>
                </div>
              )}

              {/* Numerology Tab - keeping existing code */}
              {activeTab.value === 'numerology' && (
                <div class="row g-4">
                  <div class="col-12">
                    {!numerologyData.value && !numerologyLoading.value && (
                      <div class="card border-0 shadow-lg rounded-4 mb-4">
                        <div class="card-body p-5 text-center">
                          <div class="mb-4">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="text-info">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M12 6v6l4 2"/>
                            </svg>
                          </div>
                          <h5 class="mb-3">Get Numerology Analysis</h5>
                          <p class="text-muted mb-4">Discover your numerology report, numero table, and daily predictions</p>
                          
                          {!showNumerologyForm.value ? (
                            <button 
                              class="btn btn-info btn-lg rounded-pill px-4" 
                              onClick={requestNumerologyData}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                              </svg>
                              Get Numerology Analysis
                            </button>
                          ) : (
                            <div class="card border shadow-sm" style={{ maxWidth: '500px', margin: '0 auto' }}>
                              <div class="card-body p-4">
                                <h6 class="mb-3">Enter Analysis Details</h6>
                                <div class="mb-3">
                                  <label class="form-label">Name</label>
                                  <input 
                                    type="text" 
                                    class="form-control" 
                                    value={numerologyName.value}
                                    onInput={(e) => numerologyName.value = e.target.value}
                                    placeholder="Your full name"
                                  />
                                </div>
                                <div class="mb-3">
                                  <label class="form-label">Date for Analysis</label>
                                  <input 
                                    type="date" 
                                    class="form-control" 
                                    value={numerologyDate.value}
                                    onInput={(e) => numerologyDate.value = e.target.value}
                                  />
                                </div>
                                <div class="d-flex gap-2">
                                  <button 
                                    class="btn btn-info flex-fill" 
                                    onClick={fetchNumerologyData}
                                  >
                                    Get Analysis
                                  </button>
                                  <button 
                                    class="btn btn-secondary" 
                                    onClick={() => showNumerologyForm.value = false}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {numerologyLoading.value && (
                      <div class="text-center py-5">
                        <div class="spinner-border text-info mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="text-muted">Loading numerology data...</p>
                      </div>
                    )}

                    {numerologyData.value && !numerologyLoading.value && (
                      <NumerologyView data={numerologyData.value} />
                    )}
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