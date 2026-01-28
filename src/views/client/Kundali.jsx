// frontend/src/views/client/Kundali.jsx

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../../services/api.js';
import KundaliTabs from '../../components/kundali/KundaliTabs.jsx';
import SkeletonLoader from '../../components/kundali/SkeletonLoader.jsx';

export default {
  name: 'Kundali',
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
        console.log('API Response:', response.data);
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
      <div class="kundali-container">
        {/* Header */}
        <div class="kundali-header">
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
                        <i class="fas fa-star text-warning me-2"></i>
                        Kundali
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

        {/* Content */}
        <div class="kundali-content">
          <div class="container-fluid">
            {loading.value ? (
              <SkeletonLoader />
            ) : error.value && !userDetails.value ? (
              <div class="alert alert-danger">
                <h5>Error Loading Kundali</h5>
                <p>{error.value}</p>
              </div>
            ) : userDetails.value?.astrology ? (
              <KundaliTabs data={userDetails.value.astrology} />
            ) : userDetails.value?.astrologyError ? (
              <div class="alert alert-warning">
                <h5><i class="fas fa-exclamation-triangle me-2"></i>Astrology Data Not Available</h5>
                <p>{userDetails.value.astrologyError}</p>
                <small class="text-muted">Please ensure all birth details (Date, Time, Place with coordinates) are provided.</small>
              </div>
            ) : (
              <div class="alert alert-info">
                <h5>Loading Astrology Data...</h5>
                <p>Please wait while we process the birth details.</p>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .kundali-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .kundali-header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
          }
          
          .kundali-content {
            padding: 2rem 0;
          }
        `}</style>
      </div>
    );
  }
};