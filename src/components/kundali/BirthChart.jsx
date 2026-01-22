// frontend/src/components/kundali/BirthChart.jsx

import { ref } from 'vue';
import KundaliChartViewer from './KundaliChartViewer.jsx';

export default {
  name: 'BirthChart',
  props: {
    data: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const activeSubTab = ref('planet-chart');

    const subTabs = [
      { 
        id: 'planet-chart', 
        label: 'North Indian Chart', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      },
      { 
        id: 'planet-extended-chart', 
        label: 'South Indian Chart', 
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 9h6v6H9z"/></svg>
      }
    ];

    const getChartData = (type) => {
      if (!props.data) return null;
      
      if (type === 'planet-chart') {
        return props.data.birthChart || props.data.planetChart || props.data.chart || null;
      } else if (type === 'planet-extended-chart') {
        return props.data.birthExtendedChart || props.data.planetExtendedChart || props.data.extendedChart || null;
      }
      return null;
    };

    const hasAnyChartData = () => {
      return getChartData('planet-chart') || getChartData('planet-extended-chart');
    };

    return () => (
      <div class="birth-chart">
        <div class="card border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="card-header bg-gradient-info text-white p-4">
            <h5 class="mb-0 d-flex align-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="me-3">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10,8 16,12 10,16 10,8"/>
              </svg>
              <span>Birth Chart Analysis</span>
            </h5>
          </div>
          <div class="card-body p-0">
            {!hasAnyChartData() ? (
              <div class="p-5 text-center">
                <div class="mb-4">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" class="text-warning chart-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h6 class="text-muted mb-3">Birth Chart Data Unavailable</h6>
                <p class="text-muted mb-0">Complete birth details with accurate time and location are required to generate birth charts.</p>
              </div>
            ) : (
              <>
                <nav class="nav nav-tabs border-bottom bg-light">
                  {subTabs.map(tab => {
                    const hasData = getChartData(tab.id) !== null;
                    return (
                      <button
                        key={tab.id}
                        class={`nav-link d-flex align-items-center gap-2 ${activeSubTab.value === tab.id ? 'active' : ''}`}
                        onClick={() => activeSubTab.value = tab.id}
                        disabled={!hasData}
                      >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {!hasData && (
                          <span class="badge bg-secondary ms-2">No Data</span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div class="p-4">
                  <div class="chart-container">
                    {activeSubTab.value === 'planet-chart' && (
                      <KundaliChartViewer 
                        chart={getChartData('planet-chart') || {}}
                        title="North Indian Chart"
                      />
                    )}
                    
                    {activeSubTab.value === 'planet-extended-chart' && (
                      <KundaliChartViewer 
                        chart={getChartData('planet-extended-chart') || {}}
                        title="South Indian Chart"
                      />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .chart-icon {
            animation: rotate 4s linear infinite;
          }
          
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          
          .chart-container {
            perspective: 1000px;
            transform-style: preserve-3d;
          }
          
          .nav-tabs .nav-link {
            border: none;
            color: #6c757d;
            padding: 1rem 1.5rem;
            transition: all 0.3s ease;
            background: transparent;
          }
          
          .nav-tabs .nav-link:hover:not(:disabled) {
            border-color: transparent;
            color: #007bff;
            background: rgba(0, 123, 255, 0.1);
            transform: translateY(-2px);
          }
          
          .nav-tabs .nav-link.active {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            border-color: #007bff;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
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