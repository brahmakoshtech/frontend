// frontend/src/components/kundali/PlanetaryPosition.jsx

import { ref } from 'vue';
import PlanetTable from './PlanetTable.jsx';

export default {
  name: 'PlanetaryPosition',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const activeSubTab = ref('planets');

    const subTabs = [
      { id: 'planets', label: 'Planets Position', icon: 'fas fa-sun' },
      { id: 'extended', label: 'Planets Extended Position', icon: 'fas fa-moon' }
    ];

    return () => (
      <div class="planetary-position">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-warning text-dark">
            <h5 class="mb-0">
              <i class="fas fa-globe me-2"></i>
              Planetary Position
            </h5>
          </div>
          <div class="card-body p-0">
            {/* Sub Tabs */}
            <nav class="nav nav-tabs border-bottom">
              {subTabs.map(tab => (
                <button
                  key={tab.id}
                  class={`nav-link ${activeSubTab.value === tab.id ? 'active' : ''}`}
                  onClick={() => activeSubTab.value = tab.id}
                >
                  <i class={`${tab.icon} me-2`}></i>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Sub Tab Content */}
            <div class="p-3">
              {activeSubTab.value === 'planets' && (
                <PlanetTable 
                  planets={props.data.planets || []} 
                  title="Main Planets"
                />
              )}
              
              {activeSubTab.value === 'extended' && (
                <PlanetTable 
                  planets={props.data.planetsExtended || []} 
                  title="Shadow Planets"
                />
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
          }
          
          .nav-tabs .nav-link:hover {
            border-color: transparent;
            color: #007bff;
          }
          
          .nav-tabs .nav-link.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
          }
        `}</style>
      </div>
    );
  }
};