// frontend/src/components/kundali/BirthChart.jsx

import { ref } from 'vue';
import KundaliChartViewer from './KundaliChartViewer.jsx';

export default {
  name: 'BirthChart',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const activeSubTab = ref('planet-chart');

    const subTabs = [
      { id: 'planet-chart', label: 'Planet Chart', icon: 'fas fa-chart-pie' },
      { id: 'planet-extended-chart', label: 'Planet Extended Chart', icon: 'fas fa-chart-line' }
    ];

    return () => (
      <div class="birth-chart">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">
              <i class="fas fa-chart-pie me-2"></i>
              Birth Chart
            </h5>
          </div>
          <div class="card-body p-0">
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

            <div class="p-3">
              {activeSubTab.value === 'planet-chart' && (
                <KundaliChartViewer 
                  chart={props.data.birthChart}
                  title="North Indian Chart"
                />
              )}
              
              {activeSubTab.value === 'planet-extended-chart' && (
                <KundaliChartViewer 
                  chart={props.data.birthExtendedChart}
                  title="South Indian Chart"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};