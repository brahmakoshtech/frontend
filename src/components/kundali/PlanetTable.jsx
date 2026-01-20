// frontend/src/components/kundali/PlanetTable.jsx

export default {
  name: 'PlanetTable',
  props: {
    planets: {
      type: Array,
      required: true
    },
    title: {
      type: String,
      default: 'Planets'
    }
  },
  setup(props) {
    const formatDegree = (degree) => {
      return `${degree.toFixed(2)}°`;
    };

    const getBadgeClass = (awastha) => {
      const classes = {
        'Own': 'bg-success',
        'Exalted': 'bg-primary',
        'Debilitated': 'bg-danger',
        'Neutral': 'bg-secondary'
      };
      return classes[awastha] || 'bg-secondary';
    };

    return () => (
      <div class="planet-table">
        <h6 class="mb-3">{props.title}</h6>
        {!props.planets || props.planets.length === 0 ? (
          <div class="alert alert-info">
            <p>No planetary data available</p>
          </div>
        ) : (
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead class="table-dark sticky-top">
                <tr>
                  <th>Planet</th>
                  <th>Degree</th>
                  <th>Sign</th>
                  <th>Nakshatra</th>
                  <th>House</th>
                  <th>Status</th>
                  <th>Awastha</th>
                </tr>
              </thead>
              <tbody>
                {props.planets.map(planet => (
                  <tr key={planet.id}>
                    <td class="fw-bold">{planet.name}</td>
                    <td>{formatDegree(planet.degree)}</td>
                    <td>
                      <span class="badge bg-info">{planet.sign}</span>
                    </td>
                    <td>{planet.nakshatra}</td>
                    <td>{planet.house}</td>
                    <td>
                      {planet.isRetro && <span class="badge bg-danger me-1">R</span>}
                      {planet.isCombust && <span class="badge bg-warning text-dark">C</span>}
                      {!planet.isRetro && !planet.isCombust && <span class="badge bg-success">N</span>}
                    </td>
                    <td>
                      <span class={`badge ${getBadgeClass(planet.awastha)}`}>
                        {planet.awastha}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <style jsx>{`
          .table th {
            font-size: 0.875rem;
            font-weight: 600;
          }
          
          .table td {
            vertical-align: middle;
          }
          
          .badge {
            font-size: 0.75rem;
          }
          
          .table-hover tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.1);
          }
        `}</style>
      </div>
    );
  }
};