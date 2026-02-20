// PanchangView.jsx - Complete Panchang Data Display Component
import { ref } from 'vue';

export default {
  name: 'PanchangView',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const activeTab = ref('basic');

    const tabs = [
      { 
        id: 'basic', 
        label: 'Basic Panchang', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      },
      { 
        id: 'advanced', 
        label: 'Advanced Panchang', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
      },
      { 
        id: 'muhurta', 
        label: 'Chaughadiya Muhurta', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
      },
      { 
        id: 'nakshatra', 
        label: 'Nakshatra Prediction', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      }
    ];

    const safeGet = (obj, path, defaultValue = 'N/A') => {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined && current[key] !== null ? current[key] : defaultValue;
      }, obj);
    };

    const formatMuhurtaType = (type) => {
      const typeColors = {
        'Amrit': 'success',
        'Shubh': 'primary',
        'Labh': 'info',
        'Char': 'warning',
        'Chal': 'secondary',
        'Rog': 'danger',
        'Kaal': 'dark',
        'Udveg': 'danger'
      };
      return typeColors[type] || 'secondary';
    };

    return () => (
      <div class="panchang-view">
        <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="card-header bg-gradient-warning text-dark p-4">
            <h5 class="mb-0 d-flex align-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-3">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span>Daily Panchang</span>
            </h5>
            <p class="mb-0 mt-2 small">
              <strong>Date:</strong> {safeGet(props.data, 'requestDate') !== 'N/A' 
                ? new Date(props.data.requestDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })
                : 'N/A'}
              {props.data?.location && (
                <span class="ms-3">
                  <strong>Location:</strong> {props.data.location.latitude.toFixed(4)}°, {props.data.location.longitude.toFixed(4)}°
                </span>
              )}
            </p>
          </div>

          <div class="card-body p-0">
            {/* Tab Navigation */}
            <nav class="nav nav-tabs border-bottom bg-light">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  class={`nav-link d-flex align-items-center gap-2 ${activeTab.value === tab.id ? 'active' : ''}`}
                  onClick={() => activeTab.value = tab.id}
                >
                  {tab.icon}
                  <span class="d-none d-md-inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div class="p-4">
              {/* Basic Panchang Tab */}
              {activeTab.value === 'basic' && (
                <div class="row g-4">
                  <div class="col-12">
                    <h6 class="text-primary mb-3">Basic Panchang Details</h6>
                    <div class="row g-3">
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Day</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.day')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Tithi</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.tithi')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Nakshatra</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.nakshatra')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Yog</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.yog')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Karan</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.karan')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Sunrise</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.sunrise')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Sunset</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.sunset')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Vedic Sunrise</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.vedicSunrise')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-4">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Vedic Sunset</small>
                          <strong class="text-dark">{safeGet(props.data, 'basicPanchang.vedicSunset')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Panchang Tab */}
              {activeTab.value === 'advanced' && (
                <div class="row g-4">
                  {/* Timing Details */}
                  <div class="col-lg-6">
                    <h6 class="text-primary mb-3">Timing Details</h6>
                    <div class="row g-3">
                      <div class="col-12">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Day</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.day')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Sunrise</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.sunrise')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Sunset</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.sunset')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Moonrise</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.moonrise')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Moonset</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.moonset')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Astrological Details */}
                  <div class="col-lg-6">
                    <h6 class="text-primary mb-3">Astrological Details</h6>
                    <div class="row g-3">
                      <div class="col-12">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Ayana</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.ayana')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Paksha</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.paksha')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Ritu</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.ritu')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Sun Sign</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.sunSign')}</strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Moon Sign</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.moonSign')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Muhurta Times */}
                  <div class="col-lg-6">
                    <h6 class="text-success mb-3">Auspicious Times</h6>
                    <div class="row g-3">
                      <div class="col-12">
                        <div class="p-3 rounded-3 border bg-success bg-opacity-10">
                          <small class="text-muted d-block mb-1">Abhijit Muhurta</small>
                          <strong class="text-dark">
                            {safeGet(props.data, 'advancedPanchang.abhijitMuhurta.start')} - {safeGet(props.data, 'advancedPanchang.abhijitMuhurta.end')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inauspicious Times */}
                  <div class="col-lg-6">
                    <h6 class="text-danger mb-3">Inauspicious Times</h6>
                    <div class="row g-3">
                      <div class="col-12">
                        <div class="p-3 rounded-3 border bg-danger bg-opacity-10">
                          <small class="text-muted d-block mb-1">Rahukaal</small>
                          <strong class="text-dark">
                            {safeGet(props.data, 'advancedPanchang.rahukaal.start')} - {safeGet(props.data, 'advancedPanchang.rahukaal.end')}
                          </strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-danger bg-opacity-10">
                          <small class="text-muted d-block mb-1">Guli Kaal</small>
                          <strong class="text-dark">
                            {safeGet(props.data, 'advancedPanchang.guliKaal.start')} - {safeGet(props.data, 'advancedPanchang.guliKaal.end')}
                          </strong>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="p-3 rounded-3 border bg-danger bg-opacity-10">
                          <small class="text-muted d-block mb-1">Yamghant Kaal</small>
                          <strong class="text-dark">
                            {safeGet(props.data, 'advancedPanchang.yamghantKaal.start')} - {safeGet(props.data, 'advancedPanchang.yamghantKaal.end')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Samvat Details */}
                  <div class="col-12">
                    <h6 class="text-primary mb-3">Hindu Calendar Details</h6>
                    <div class="row g-3">
                      <div class="col-md-6 col-lg-3">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Vikram Samvat</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.vikramSamvat')}</strong>
                          <div class="mt-1 small text-muted">{safeGet(props.data, 'advancedPanchang.vkramSamvatName')}</div>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-3">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Shaka Samvat</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.shakaSamvat')}</strong>
                          <div class="mt-1 small text-muted">{safeGet(props.data, 'advancedPanchang.shakaSamvatName')}</div>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-3">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Purnimanta Maah</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.hinduMaah.purnimanta')}</strong>
                        </div>
                      </div>
                      <div class="col-md-6 col-lg-3">
                        <div class="p-3 rounded-3 border bg-light">
                          <small class="text-muted d-block mb-1">Amanta Maah</small>
                          <strong class="text-dark">{safeGet(props.data, 'advancedPanchang.hinduMaah.amanta')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chaughadiya Muhurta Tab */}
              {activeTab.value === 'muhurta' && (
                <div class="row g-4">
                  <div class="col-lg-6">
                    <h6 class="text-primary mb-3">Day Chaughadiya</h6>
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered">
                        <thead class="table-light">
                          <tr>
                            <th>Time</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {props.data?.chaughadiyaMuhurta?.day?.map((muhurta, index) => (
                            <tr key={index}>
                              <td class="small">{muhurta.time}</td>
                              <td>
                                <span class={`badge bg-${formatMuhurtaType(muhurta.muhurta)}`}>
                                  {muhurta.muhurta}
                                </span>
                              </td>
                            </tr>
                          )) || (
                            <tr>
                              <td colspan="2" class="text-center text-muted">No data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="col-lg-6">
                    <h6 class="text-primary mb-3">Night Chaughadiya</h6>
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered">
                        <thead class="table-light">
                          <tr>
                            <th>Time</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {props.data?.chaughadiyaMuhurta?.night?.map((muhurta, index) => (
                            <tr key={index}>
                              <td class="small">{muhurta.time}</td>
                              <td>
                                <span class={`badge bg-${formatMuhurtaType(muhurta.muhurta)}`}>
                                  {muhurta.muhurta}
                                </span>
                              </td>
                            </tr>
                          )) || (
                            <tr>
                              <td colspan="2" class="text-center text-muted">No data available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Nakshatra Prediction Tab */}
              {activeTab.value === 'nakshatra' && (
                <div>
                  <h6 style={{ color: '#6366f1', marginBottom: '1rem', fontWeight: '700' }}>Daily Nakshatra Prediction</h6>
                  {props.data?.dailyNakshatraPrediction?.missingFields?.length ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '2px dashed #f59e0b'
                    }}>
                      <h6 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Personalization data required</h6>
                      <p style={{ color: '#92400e', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        {props.data.dailyNakshatraPrediction.message}
                      </p>
                      <p style={{ color: '#92400e', margin: 0, fontSize: '0.85rem' }}>
                        <strong>Missing fields:</strong> {props.data.dailyNakshatraPrediction.missingFields.join(', ')}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Basic Info */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Birth Moon Sign</div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {safeGet(props.data, 'dailyNakshatraPrediction.birthMoonSign')}
                          </div>
                        </div>
                        <div style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Birth Nakshatra</div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {safeGet(props.data, 'dailyNakshatraPrediction.birthMoonNakshatra')}
                          </div>
                        </div>
                        <div style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Current Nakshatra</div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {safeGet(props.data, 'dailyNakshatraPrediction.nakshatra')}
                          </div>
                        </div>
                        <div style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Mood</div>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {safeGet(props.data, 'dailyNakshatraPrediction.mood')} ({safeGet(props.data, 'dailyNakshatraPrediction.mood_percentage')})
                          </div>
                        </div>
                      </div>

                      {/* Lucky Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderRadius: '12px', border: '1px solid #6ee7b7' }}>
                          <div style={{ fontSize: '0.75rem', color: '#065f46', marginBottom: '0.5rem', fontWeight: '600' }}>Lucky Colors</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {props.data?.dailyNakshatraPrediction?.lucky_color?.map((color, index) => (
                              <span key={index} style={{
                                padding: '0.25rem 0.625rem',
                                background: '#10b981',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                {color}
                              </span>
                            )) || <span style={{ color: '#065f46' }}>N/A</span>}
                          </div>
                        </div>
                        <div style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '12px', border: '1px solid #60a5fa' }}>
                          <div style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.5rem', fontWeight: '600' }}>Lucky Numbers</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {props.data?.dailyNakshatraPrediction?.lucky_number?.map((num, index) => (
                              <span key={index} style={{
                                padding: '0.25rem 0.625rem',
                                background: '#3b82f6',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: '600'
                              }}>
                                {num}
                              </span>
                            )) || <span style={{ color: '#1e40af' }}>N/A</span>}
                          </div>
                        </div>
                        <div style={{ padding: '0.875rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '12px', border: '1px solid #fbbf24' }}>
                          <div style={{ fontSize: '0.75rem', color: '#78350f', marginBottom: '0.25rem', fontWeight: '600' }}>Lucky Time</div>
                          <div style={{ fontWeight: '600', color: '#78350f' }}>
                            {safeGet(props.data, 'dailyNakshatraPrediction.lucky_time')}
                          </div>
                        </div>
                      </div>

                      {/* Prediction Text */}
                      {props.data?.dailyNakshatraPrediction?.bot_response && (
                        <div style={{
                          padding: '1rem',
                          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                          borderRadius: '12px',
                          border: '1px solid #818cf8',
                          marginBottom: '1rem'
                        }}>
                          <h6 style={{ color: '#3730a3', marginBottom: '0.5rem', fontWeight: '700' }}>Today's Prediction</h6>
                          <p style={{ margin: 0, color: '#3730a3', lineHeight: '1.6', fontSize: '0.9rem' }}>
                            {props.data.dailyNakshatraPrediction.bot_response}
                          </p>
                        </div>
                      )}

                      {/* Detailed Predictions */}
                      {props.data?.dailyNakshatraPrediction?.prediction && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {Object.entries(props.data.dailyNakshatraPrediction.prediction).map(([key, value]) => (
                            <div key={key} style={{
                              padding: '1rem',
                              background: 'white',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                            }}>
                              <h6 style={{ color: '#6366f1', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'capitalize' }}>
                                {key.replace(/_/g, ' ')}
                              </h6>
                              <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '0.9rem' }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .nav-tabs .nav-link {
            border: none;
            color: #6c757d;
            padding: 1rem 1.5rem;
            transition: all 0.3s ease;
            background: transparent;
          }
          
          .nav-tabs .nav-link:hover:not(.active) {
            border-color: transparent;
            color: #007bff;
            background: rgba(0, 123, 255, 0.1);
          }
          
          .nav-tabs .nav-link.active {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border-color: #007bff;
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
          }

          .bg-gradient-warning {
            background: linear-gradient(135deg, #ffc107, #ff9800);
          }
        `}</style>
      </div>
    );
  }
};