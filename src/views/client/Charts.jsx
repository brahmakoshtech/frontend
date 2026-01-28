// frontend/src/views/client/Charts.jsx

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../services/api.js';
import KundaliChartViewer from '../../components/kundali/KundaliChartViewer.jsx';

export default {
  name: 'Charts',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userId = route.params.userId;
    
    const userDetails = ref(null);
    const loading = ref(true);
    const error = ref(null);



    const fetchUserDetails = async () => {
      try {
        loading.value = true;
        const response = await api.getUserCompleteDetails(userId);
        userDetails.value = response.data;
      } catch (err) {
        console.error('Failed to fetch user details:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.back();
    };

    onMounted(() => {
      fetchUserDetails();
    });

    return () => (
      <div class="charts-container">
        <div class="charts-header">
          <div class="container-fluid">
            <div class="row">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center py-3">
                  <div class="d-flex align-items-center">
                    <button onClick={goBack} class="btn btn-outline-secondary me-3">
                      <i class="fas fa-arrow-left"></i>
                    </button>
                    <div>
                      <h2 class="mb-0 fw-bold">
                        <i class="fas fa-chart-pie text-info me-2"></i>
                        Charts
                      </h2>
                      <small class="text-muted">
                        {userDetails.value?.user?.profile?.name || 'Loading...'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="charts-content">
          <div class="container-fluid">
            {loading.value ? (
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading charts...</p>
              </div>
            ) : userDetails.value?.astrology ? (
              <div class="row">
                <div class="col-lg-6 mb-4">
                  <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                      <KundaliChartViewer 
                        chart={userDetails.value.astrology?.charts?.northIndian}
                        title="North Indian Chart (Rashi)"
                      />
                    </div>
                  </div>
                </div>
                
                <div class="col-lg-6 mb-4">
                  <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                      <KundaliChartViewer 
                        chart={userDetails.value.astrology?.charts?.southIndian}
                        title="South Indian Chart (Rashi)"
                      />
                    </div>
                  </div>
                </div>
                
                <div class="col-lg-6 mb-4">
                  <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                      <KundaliChartViewer 
                        chart={userDetails.value.astrology?.charts?.navamsa}
                        title="Navamsa Chart (D9)"
                      />
                    </div>
                  </div>
                </div>
                
                <div class="col-lg-6 mb-4">
                  <div class="card border-0 shadow-sm h-100">
                    <div class="card-body">
                      <KundaliChartViewer 
                        chart={userDetails.value.astrology?.charts?.dashamsa}
                        title="Dashamsa Chart (D10)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : userDetails.value?.astrologyError ? (
              <div class="alert alert-warning">
                <h5><i class="fas fa-exclamation-triangle me-2"></i>Charts Not Available</h5>
                <p>{userDetails.value.astrologyError}</p>
                <small class="text-muted">Please ensure all birth details are provided to generate charts.</small>
              </div>
            ) : (
              <div class="alert alert-info">
                <h5>No Chart Data Available</h5>
                <p>Chart data is not available for this user.</p>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .charts-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .charts-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
          }
          
          .charts-content {
            padding: 2rem 0;
          }
        `}</style>
      </div>
    );
  }
};