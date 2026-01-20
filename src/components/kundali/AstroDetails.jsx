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
    return () => (
      <div class="astro-details">
        {!props.data ? (
          <div class="alert alert-warning">
            <p>Astrological details not available</p>
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
                          <td><span class="badge bg-primary fs-6">{props.data.astroDetails?.ascendant}</span></td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Moon Sign</td>
                          <td><span class="badge bg-info fs-6">{props.data.astroDetails?.sign}</span></td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Sign Lord</td>
                          <td>{props.data.astroDetails?.signLord}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Nakshatra</td>
                          <td><span class="badge bg-warning text-dark fs-6">{props.data.astroDetails?.nakshatra}</span></td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Nakshatra Lord</td>
                          <td>{props.data.astroDetails?.nakshatraLord}</td>
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
                          <td>{props.data.astroDetails?.charan}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Varna</td>
                          <td>{props.data.astroDetails?.varna}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Gan</td>
                          <td>{props.data.astroDetails?.gan}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Yoni</td>
                          <td>{props.data.astroDetails?.yoni}</td>
                        </tr>
                        <tr>
                          <td class="fw-bold">Nadi</td>
                          <td>{props.data.astroDetails?.nadi}</td>
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