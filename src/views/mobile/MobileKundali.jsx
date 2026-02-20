import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, StarIcon } from '@heroicons/vue/24/outline';
import api from '../../services/api';
import { useToast } from 'vue-toastification';
import { useAuth } from '../../store/auth';
import AstroDetails from '../../components/kundali/AstroDetails.jsx';
import NumerologyView from '../../components/kundali/NumerologyView.jsx';
import PanchangView from '../../components/kundali/PanchangView.jsx';

export default {
  name: 'MobileKundali',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const { user } = useAuth();
    const loading = ref(false);
    const activeTab = ref('astro');
    const kundaliData = ref(null);
    const userData = ref(null);
    const numerologyData = ref(null);
    const panchangData = ref(null);
    const error = ref(null);

    const goBack = () => {
      router.push('/mobile/user/dashboard');
    };

    const fetchKundaliData = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        const token = localStorage.getItem('token_user');
        if (!token || !user.value?._id) {
          error.value = 'User not authenticated';
          return;
        }
        
        const response = await api.request(`/client/users/${user.value._id}/complete-details`, { token });
        
        if (response?.data) {
          if (response.data.astrology) {
            kundaliData.value = response.data.astrology;
          }
          
          userData.value = response.data.user;
          
          // Auto-fetch panchang and numerology data
          fetchPanchangData();
          fetchNumerologyData();
        } else {
          error.value = 'No data available';
        }
      } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load kundali data';
        toast.error(error.value);
      } finally {
        loading.value = false;
      }
    };

    const fetchPanchangData = async () => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token || !user.value?._id) return;
        
        const response = await api.request(`/client/users/${user.value._id}/panchang?force=true`, { token });
        
        if (response?.data) {
          panchangData.value = { data: response.data, source: response.source };
        }
      } catch (err) {
        if (err.message?.includes('401') || err.error?.includes('401')) {
          panchangData.value = { error: true, message: 'API credentials need to be configured in backend' };
        } else {
          panchangData.value = { error: true, message: err.message || 'Failed to load panchang data' };
        }
      }
    };

    const fetchNumerologyData = async () => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token || !user.value?._id) return;
        
        const response = await api.post(`/client/users/${user.value._id}/numerology`, {}, { token });
        
        if (response?.data?.data) {
          numerologyData.value = { data: response.data.data, source: response.data.source };
        }
      } catch (err) {
        if (err.message?.includes('401') || err.error?.includes('401')) {
          numerologyData.value = { error: true, message: 'API credentials need to be configured in backend' };
        } else {
          numerologyData.value = { error: true, message: err.message || 'Failed to load numerology data' };
        }
      }
    };

    onMounted(() => {
      fetchKundaliData();
    });

    return () => (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f8fafc 0%, #e0e7ff 100%)',
        paddingBottom: '2rem'
      }}>
        <style>{`
          .kundali-header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            padding: 1.25rem 1rem;
            margin: 1rem;
            border-radius: 20px;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }

          .header-content {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .back-btn {
            background: rgba(255, 255, 255, 0.25);
            border: none;
            color: white;
            padding: 0.5rem;
            border-radius: 12px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            backdrop-filter: blur(10px);
          }

          .header-title {
            flex: 1;
          }

          .header-title h1 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
          }

          .header-title p {
            margin: 0.25rem 0 0 0;
            font-size: 0.85rem;
            opacity: 0.95;
          }

          .tabs {
            display: flex;
            gap: 0.5rem;
            margin: 1rem;
            background: white;
            padding: 0.5rem;
            border-radius: 16px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }

          .tab {
            flex: 1;
            padding: 0.75rem;
            border: none;
            border-radius: 12px;
            background: transparent;
            color: #64748b;
            font-weight: 600;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .tab.active {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          }

          .content-card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            margin: 0 1rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }

          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e0e7ff;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 2rem auto;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .error-message {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            padding: 1.25rem;
            text-align: center;
            border: 2px dashed #f59e0b;
            color: #92400e;
            font-weight: 600;
          }
        `}</style>

        {/* Header */}
        <div class="kundali-header">
          <div class="header-content">
            <button onClick={goBack} class="back-btn">
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
            <div class="header-title">
              <h1>⭐ My Kundali</h1>
              <p>Discover your cosmic insights</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div class="tabs">
          <button 
            class={`tab ${activeTab.value === 'astro' ? 'active' : ''}`}
            onClick={() => activeTab.value = 'astro'}
          >
            ⭐ Astro
          </button>
          <button 
            class={`tab ${activeTab.value === 'numerology' ? 'active' : ''}`}
            onClick={() => activeTab.value = 'numerology'}
          >
            🔢 Numerology
          </button>
          <button 
            class={`tab ${activeTab.value === 'panchang' ? 'active' : ''}`}
            onClick={() => activeTab.value = 'panchang'}
          >
            📅 Panchang
          </button>
        </div>

        {/* Content */}
        <div class="content-card">
          {loading.value ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div class="spinner"></div>
              <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading...</p>
            </div>
          ) : (
            <>
              {/* Astro Tab */}
              {activeTab.value === 'astro' && (
                kundaliData.value ? (
                  <AstroDetails data={kundaliData.value} />
                ) : error.value ? (
                  <div class="error-message">⚠️ {error.value}</div>
                ) : (
                  <div class="error-message">✨ Please update your birth details in profile</div>
                )
              )}

              {/* Numerology Tab */}
              {activeTab.value === 'numerology' && (
                numerologyData.value?.error ? (
                  <div class="error-message">🔢 {numerologyData.value.message}</div>
                ) : numerologyData.value?.data ? (
                  <NumerologyView data={numerologyData.value.data} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div class="spinner"></div>
                    <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading numerology...</p>
                  </div>
                )
              )}

              {/* Panchang Tab */}
              {activeTab.value === 'panchang' && (
                panchangData.value?.error ? (
                  <div class="error-message">📅 {panchangData.value.message}</div>
                ) : panchangData.value?.data ? (
                  <PanchangView data={panchangData.value.data} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <div class="spinner"></div>
                    <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading panchang...</p>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    );
  }
};
