// frontend/src/components/kundali/PlanetTable.jsx

export default {
  name: 'PlanetTable',
  props: {
    planets: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: 'Planets'
    }
  },
  setup(props) {
    const formatDegree = (degree) => {
      if (degree === undefined || degree === null || isNaN(degree)) return 'N/A';
      return `${parseFloat(degree).toFixed(2)}°`;
    };

    const getBadgeClass = (awastha) => {
      if (!awastha) return 'bg-secondary';
      const classes = {
        'Own': 'bg-success',
        'Exalted': 'bg-primary',
        'Debilitated': 'bg-danger',
        'Neutral': 'bg-secondary',
        'Friend': 'bg-info',
        'Enemy': 'bg-warning'
      };
      return classes[awastha] || 'bg-secondary';
    };

    const safeGet = (obj, key, defaultValue = 'N/A') => {
      const value = obj && obj[key] !== undefined && obj[key] !== null ? obj[key] : defaultValue;
      // Basic XSS protection - escape HTML characters
      if (typeof value === 'string') {
        return value.replace(/[<>"'&]/g, (match) => {
          const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
          return escapeMap[match];
        });
      }
      return value;
    };

    return () => {
      const validPlanets = Array.isArray(props.planets) ? props.planets : [];
      
      return (
        <div class="planet-table">
          <h6 class="mb-3">{props.title}</h6>
          {validPlanets.length === 0 ? (
            <div class="alert alert-info">
              <div class="d-flex align-items-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="me-2">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 16v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <path d="M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>No planetary data available. Complete birth details are required for planetary calculations.</span>
              </div>
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
                  {validPlanets.map((planet, index) => {
                    const planetId = planet.id || planet.name || index;
                    return (
                      <tr key={planetId}>
                        <td class="fw-bold">{safeGet(planet, 'name')}</td>
                        <td>{formatDegree(planet.degree)}</td>
                        <td>
                          {safeGet(planet, 'sign') !== 'N/A' ? (
                            <span class="badge bg-info">{safeGet(planet, 'sign')}</span>
                          ) : (
                            <span class="text-muted">N/A</span>
                          )}
                        </td>
                        <td>{safeGet(planet, 'nakshatra')}</td>
                        <td>{safeGet(planet, 'house')}</td>
                        <td>
                          {planet.isRetro && <span class="badge bg-danger me-1" title="Retrograde">R</span>}
                          {planet.isCombust && <span class="badge bg-warning text-dark me-1" title="Combust">C</span>}
                          {!planet.isRetro && !planet.isCombust && <span class="badge bg-success" title="Normal">N</span>}
                        </td>
                        <td>
                          <span class={`badge ${getBadgeClass(planet.awastha)}`}>
                            {safeGet(planet, 'awastha', 'Neutral')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
            
            .alert {
              border-radius: 8px;
            }
          `}</style>
        </div>
      );
    };
  }
};