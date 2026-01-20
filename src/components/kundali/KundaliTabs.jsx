// frontend/src/components/kundali/KundaliTabs.jsx

import { ref } from 'vue';
import BirthDetails from './BirthDetails.jsx';
import AstroDetails from './AstroDetails.jsx';
import PlanetaryPosition from './PlanetaryPosition.jsx';
import BirthChart from './BirthChart.jsx';

export default {
  name: 'KundaliTabs',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const activeTab = ref('birth-details');

    const tabs = [
      { id: 'birth-details', label: 'Birth Details', icon: 'fas fa-user', component: BirthDetails },
      { id: 'astro-details', label: 'Astro Details', icon: 'fas fa-star', component: AstroDetails },
      { id: 'planetary-position', label: 'Planetary Position', icon: 'fas fa-globe', component: PlanetaryPosition },
      { id: 'birth-chart', label: 'Birth Chart', icon: 'fas fa-chart-pie', component: BirthChart }
    ];

    const setActiveTab = (tabId) => {
      activeTab.value = tabId;
    };

    return () => (
      <div class="kundali-tabs">
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-body p-0">
            <nav class="nav nav-pills nav-fill">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  class={`nav-link ${activeTab.value === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i class={`${tab.icon} me-2`}></i>
                  <span class="d-none d-md-inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div class="tab-content">
          {tabs.map(tab => (
            <div
              key={tab.id}
              class={`tab-pane ${activeTab.value === tab.id ? 'active show' : ''}`}
            >
              {activeTab.value === tab.id && (
                <tab.component data={props.data} />
              )}
            </div>
          ))}
        </div>

        <style jsx>{`
          .nav-pills .nav-link {
            border-radius: 0;
            color: #6c757d;
            background: transparent;
            border: none;
            padding: 1rem;
            transition: all 0.3s ease;
          }
          
          .nav-pills .nav-link:hover {
            background: rgba(0, 123, 255, 0.1);
            color: #007bff;
          }
          
          .nav-pills .nav-link.active {
            background: linear-gradient(45deg, #007bff, #0056b3);
            color: white;
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
          }
          
          .tab-pane {
            display: none;
            animation: fadeIn 0.3s ease-in-out;
          }
          
          .tab-pane.active {
            display: block;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }
};