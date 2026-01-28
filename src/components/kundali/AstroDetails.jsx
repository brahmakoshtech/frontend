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
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined && current[key] !== null ? current[key] : defaultValue;
      }, obj);
    };

    return () => {
      // Safe data access with fallbacks
      const astroDetails = props.data?.astroDetails || {};
      const hasData = props.data && Object.keys(astroDetails).length > 0;

      return (
        <div class="astro-details">
          {!hasData ? (
            <div class="alert alert-warning">
              <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span>Astrological details not available. Complete birth details are required for astrology calculations.</span>
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
                  <div class="col-lg-6">
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <tbody>
                          <tr>
                            <td class="fw-bold">Ascendant</td>
                            <td>
                              {safeGet(astroDetails, 'ascendant') !== 'N/A' ? (
                                <span class="badge bg-primary fs-6">{safeGet(astroDetails, 'ascendant')}</span>
                              ) : (
                                <span class="text-muted">N/A</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Moon Sign</td>
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
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div class="col-lg-6">
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <tbody>
                          <tr>
                            <td class="fw-bold">Charan</td>
                            <td>{safeGet(astroDetails, 'charan')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Varna</td>
                            <td>{safeGet(astroDetails, 'varna')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Gan</td>
                            <td>{safeGet(astroDetails, 'gan')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Yoni</td>
                            <td>{safeGet(astroDetails, 'yoni')}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Nadi</td>
                            <td>{safeGet(astroDetails, 'nadi')}</td>
                          </tr>
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