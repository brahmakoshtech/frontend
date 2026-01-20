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
    return () => (
      <div class="birth-details">
        {!props.data ? (
          <div class="alert alert-warning">
            <p>Birth details not available</p>
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
                          <td>{props.data.birthDetails?.day}/{props.data.birthDetails?.month}/{props.data.birthDetails?.year}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Time</td>
                          <td>{props.data.birthDetails?.hour}:{props.data.birthDetails?.minute?.toString().padStart(2, '0')}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Timezone</td>
                          <td>{props.data.birthDetails?.timezone || '+05:30'}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Sunrise</td>
                          <td>{props.data.birthDetails?.sunrise}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Sunset</td>
                          <td>{props.data.birthDetails?.sunset}</td>
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
                          <td>{props.data.birthDetails?.latitude}°</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Longitude</td>
                          <td>{props.data.birthDetails?.longitude}°</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Ayanamsha</td>
                          <td>{props.data.birthDetails?.ayanamsha}°</td>
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
  }
};