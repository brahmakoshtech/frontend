// frontend/src/components/kundali/KundaliChartViewer.jsx

import { ref } from 'vue';

export default {
  name: 'KundaliChartViewer',
  props: {
    chart: {
      type: Object,
      required: true
    },
    title: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const isFullscreen = ref(false);
    const isZoomed = ref(false);

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value;
    };

    const toggleZoom = () => {
      isZoomed.value = !isZoomed.value;
    };

    return () => (
      <div class="kundali-chart-viewer">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">{props.title}</h6>
          <div class="btn-group">
            <button 
              class="btn btn-outline-primary btn-sm"
              onClick={toggleZoom}
              title="Zoom"
            >
              <i class="fas fa-search-plus"></i>
            </button>
            <button 
              class="btn btn-outline-primary btn-sm"
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              <i class="fas fa-expand"></i>
            </button>
          </div>
        </div>

        <div class={`chart-container ${isZoomed.value ? 'zoomed' : ''} ${isFullscreen.value ? 'fullscreen' : ''}`}>
          <div class="chart-placeholder">
            <div class="chart-grid">
              {Array.from({length: 12}, (_, i) => (
                <div key={i} class="chart-house">
                  <div class="house-number">{i + 1}</div>
                  <div class="house-planets">
                    {props.chart?.houses?.[i + 1]?.map((planet, idx) => (
                      <span key={idx} class="planet-badge">{planet}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isFullscreen.value && (
          <div class="fullscreen-overlay" onClick={toggleFullscreen}>
            <div class="fullscreen-content" onClick={(e) => e.stopPropagation()}>
              <button class="btn-close-fullscreen" onClick={toggleFullscreen}>
                <i class="fas fa-times"></i>
              </button>
              <div class="chart-grid large">
                {Array.from({length: 12}, (_, i) => (
                  <div key={i} class="chart-house">
                    <div class="house-number">{i + 1}</div>
                    <div class="house-planets">
                      {props.chart?.houses?.[i + 1]?.map((planet, idx) => (
                        <span key={idx} class="planet-badge">{planet}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .chart-container {
            transition: all 0.3s ease;
          }
          
          .chart-container.zoomed {
            transform: scale(1.2);
          }
          
          .chart-placeholder {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 1rem;
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .chart-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 2px;
            width: 100%;
            max-width: 400px;
            aspect-ratio: 4/3;
          }
          
          .chart-grid.large {
            max-width: 600px;
          }
          
          .chart-house {
            background: white;
            border: 1px solid #dee2e6;
            padding: 0.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80px;
            position: relative;
          }
          
          .house-number {
            position: absolute;
            top: 2px;
            left: 4px;
            font-size: 0.75rem;
            font-weight: bold;
            color: #6c757d;
          }
          
          .house-planets {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            justify-content: center;
            margin-top: 1rem;
          }
          
          .planet-badge {
            background: #007bff;
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 500;
          }
          
          .fullscreen-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .fullscreen-content {
            position: relative;
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 90vw;
            max-height: 90vh;
          }
          
          .btn-close-fullscreen {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </div>
    );
  }
};