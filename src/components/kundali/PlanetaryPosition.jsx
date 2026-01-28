// frontend/src/components/kundali/PlanetaryPosition.jsx

import { ref } from 'vue';
import PlanetTable from './PlanetTable.jsx';

export default {
  name: 'PlanetaryPosition',
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const activeSubTab = ref('planets');

    const subTabs = [
      { 
        id: 'planets', 
        label: 'Planets Position', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      },
      { 
        id: 'extended', 
        label: 'Planets Extended Position', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="4"/></svg>
      }
    ];

    const getPlanetsData = (type) => {
      if (!props.data) return [];
      
      if (type === 'planets') {
        return props.data.planets || props.data.planetsPosition || [];
      } else if (type === 'extended') {
        return props.data.planetsExtended || props.data.planetsExtendedPosition || props.data.shadowPlanets || [];
      }
      return [];
    };

    const hasAnyData = () => {
      return getPlanetsData('planets').length > 0 || getPlanetsData('extended').length > 0;
    };

    return () => (
      <div class="planetary-position">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0 d-flex align-items-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
              Planetary Position
            </h5>
          </div>
          <div class="card-body p-0">
            {!hasAnyData() ? (
              <div class="p-4">
                <div class="alert alert-warning">
                  <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <span>Planetary position data not available. Complete birth details are required for planetary calculations.</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Sub Tabs */}
                <nav class="nav nav-tabs border-bottom">
                  {subTabs.map(tab => (
                    <button
                      key={tab.id}
                      class={`nav-link d-flex align-items-center gap-2 ${activeSubTab.value === tab.id ? 'active' : ''}`}
                      onClick={() => activeSubTab.value = tab.id}
                      disabled={getPlanetsData(tab.id).length === 0}
                    >
                      {tab.icon}
                      {tab.label}
                      {getPlanetsData(tab.id).length === 0 && (
                        <span class="badge bg-secondary ms-2">No Data</span>
                      )}
                    </button>
                  ))}
                </nav>

                {/* Sub Tab Content */}
                <div class="p-3">
                  {activeSubTab.value === 'planets' && (
                    <PlanetTable 
                      planets={getPlanetsData('planets')} 
                      title="Main Planets"
                    />
                  )}
                  
                  {activeSubTab.value === 'extended' && (
                    <PlanetTable 
                      planets={getPlanetsData('extended')} 
                      title="Shadow Planets"
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .nav-tabs .nav-link {
            border: none;
            color: #6c757d;
            padding: 1rem 1.5rem;
            transition: all 0.3s ease;
          }
          
          .nav-tabs .nav-link:hover:not(:disabled) {
            border-color: transparent;
            color: #007bff;
          }
          
          .nav-tabs .nav-link.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
          }
          
          .nav-tabs .nav-link:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .badge {
            font-size: 0.65rem;
          }
        `}</style>
      </div>
    );
  }
};