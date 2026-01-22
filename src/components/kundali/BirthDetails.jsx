// frontend/src/components/kundali/BirthDetails.jsx

export default {
  name: 'BirthDetails',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const formatDate = (day, month, year) => {
      if (!day || !month || !year) return 'N/A';
      return `${day}/${month}/${year}`;
    };

    const formatTime = (hour, minute) => {
      if (hour === undefined || minute === undefined) return 'N/A';
      return `${hour}:${minute.toString().padStart(2, '0')}`;
    };

    const formatCoordinate = (coord) => {
      if (coord === undefined || coord === null) return 'N/A';
      return `${coord}°`;
    };

    return () => {
      // Safe data access with fallbacks
      const birthDetails = props.data?.birthDetails || {};
      const hasData = props.data && Object.keys(birthDetails).length > 0;

      return (
        <div class="birth-details">
          {!hasData ? (
            <div class="alert alert-warning">
              <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span>Birth details not available. Please ensure complete birth information is provided.</span>
              </div>
            </div>
          ) : (
            <div class="card border-0 shadow-sm">
              <div class="card-header bg-primary text-white">
                <h5 class="mb-0">
                  <i class="fas fa-user me-2"></i>
                  Birth Details
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-lg-6">
                    <div class="table-responsive">
                      <table class="table table-striped">
                        <tbody>
                          <tr>
                            <td class="fw-bold">Date</td>
                            <td>{formatDate(birthDetails.day, birthDetails.month, birthDetails.year)}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Time</td>
                            <td>{formatTime(birthDetails.hour, birthDetails.minute)}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Timezone</td>
                            <td>{birthDetails.timezone || '+05:30'}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Sunrise</td>
                            <td>{birthDetails.sunrise || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Sunset</td>
                            <td>{birthDetails.sunset || 'N/A'}</td>
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
                            <td class="fw-bold">Latitude</td>
                            <td>{formatCoordinate(birthDetails.latitude)}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Longitude</td>
                            <td>{formatCoordinate(birthDetails.longitude)}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Ayanamsha</td>
                            <td>{formatCoordinate(birthDetails.ayanamsha)}</td>
                          </tr>
                          <tr>
                            <td class="fw-bold">Place</td>
                            <td>{birthDetails.place || 'N/A'}</td>
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