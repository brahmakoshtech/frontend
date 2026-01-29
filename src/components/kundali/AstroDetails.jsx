// frontend/src/components/kundali/AstroDetails.jsx

export default {
  name: 'AstroDetails',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const safeGet = (obj, path, defaultValue = 'N/A') => {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current && current[key] !== undefined && current[key] !== null && current[key] !== '') {
          current = current[key];
        } else {
          return defaultValue;
        }
      }
      
      return current;
    };

    const getBadgeClass = (value) => {
      if (!value || value === 'N/A') return 'bg-secondary';
      return 'bg-primary';
    };

    return () => {
      // Safe data access with fallbacks
      const astroDetails = props.data?.astroDetails || {};
      const hasData = props.data && Object.keys(astroDetails).length > 0;
      
      // Check if we have minimum required astrological data
      const hasMinimumData = astroDetails.ascendant || astroDetails.sign || astroDetails.nakshatra;

      return (
        <div class="astro-details">
          {!hasData || !hasMinimumData ? (
            <div class="alert alert-warning">
              <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span>Astrological details not available. Complete birth details (Date, Time, and Location) are required for astrology calculations.</span>
              </div>
            </div>
          ) : (
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-success text-white">
                <h5 class="mb-0">
                  <i class="fas fa-star me-2"></i>
                  Astrological Details
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  {/* Primary Astrological Information */}
                  <div class="col-lg-6 mb-4">
                    <h6 class="text-muted mb-3 border-bottom pb-2">
                      <i class="fas fa-chart-pie me-2"></i>
                      Primary Details
                    </h6>
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <tbody>
                          <tr>
                            <td class="fw-bold">Ascendant (Lagna)</td>
                            <td>
                              {safeGet(astroDetails, 'ascendant') !== 'N/A' ? (
                                <span class="badge bg-primary fs-6">{safeGet(astroDetails, 'ascendant')}</span>
                              ) : (
                                <span class="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Ascendant Lord</td>
                            <td>{safeGet(astroDetails, 'ascendantLord')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Moon Sign (Rashi)</td>
                            <td>
                              {safeGet(astroDetails, 'sign') !== 'N/A' ? (
                                <span class="badge bg-info fs-6">{safeGet(astroDetails, 'sign')}</span>
                              ) : (
                                <span class="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Sign Lord</td>
                            <td>{safeGet(astroDetails, 'signLord')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Nakshatra Information */}
                  <div class="col-lg-6 mb-4">
                    <h6 class="text-muted mb-3 border-bottom pb-2">
                      <i class="fas fa-moon me-2"></i>
                      Nakshatra Details
                    </h6>
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <tbody>
                          <tr>
                            <td class="fw-bold">Nakshatra</td>
                            <td>
                              {safeGet(astroDetails, 'nakshatra') !== 'N/A' ? (
                                <span class="badge bg-warning text-dark fs-6">{safeGet(astroDetails, 'nakshatra')}</span>
                              ) : (
                                <span class="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Nakshatra Lord</td>
                            <td>{safeGet(astroDetails, 'nakshatraLord')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Charan (Pada)</td>
                            <td>
                              {safeGet(astroDetails, 'charan') !== 'N/A' ? (
                                <span class="badge bg-secondary">{safeGet(astroDetails, 'charan')}</span>
                              ) : (
                                <span class="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Name Alphabet</td>
                            <td>
                              {safeGet(astroDetails, 'nameAlphabet') !== 'N/A' ? (
                                <span class="badge bg-primary">{safeGet(astroDetails, 'nameAlphabet')}</span>
                              ) : (
                                <span class="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Vedic Classifications */}
                  <div class="col-lg-6 mb-4">
                    <h6 class="text-muted mb-3 border-bottom pb-2">
                      <i class="fas fa-book me-2"></i>
                      Vedic Classifications
                    </h6>
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <tbody>
                          <tr>
                            <td class="fw-bold">Varna</td>
                            <td>{safeGet(astroDetails, 'varna')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Vashya</td>
                            <td>{safeGet(astroDetails, 'vashya')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Yoni</td>
                            <td>{safeGet(astroDetails, 'yoni')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Gan</td>
                            <td>{safeGet(astroDetails, 'gan')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Nadi</td>
                            <td>{safeGet(astroDetails, 'nadi')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Panchang Details */}
                  <div class="col-lg-6 mb-4">
                    <h6 class="text-muted mb-3 border-bottom pb-2">
                      <i class="fas fa-calendar-alt me-2"></i>
                      Panchang Details
                    </h6>
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <tbody>
                          <tr>
                            <td class="fw-bold">Tithi</td>
                            <td>{safeGet(astroDetails, 'tithi')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Yog</td>
                            <td>{safeGet(astroDetails, 'yog')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Karan</td>
                            <td>{safeGet(astroDetails, 'karan')}</td>
                          </tr>
                          {safeGet(astroDetails, 'tatva') !== 'N/A' && (
                            <tr>
                              <td class="fw-bold">Tatva</td>
                              <td>{safeGet(astroDetails, 'tatva')}</td>
                            </tr>
                          )}
                          {safeGet(astroDetails, 'paya') !== 'N/A' && (
                            <tr>
                              <td class="fw-bold">Paya</td>
                              <td>{safeGet(astroDetails, 'paya')}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };
  }
};