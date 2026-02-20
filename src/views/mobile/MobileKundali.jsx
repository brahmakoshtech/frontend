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
        
        // Fetch complete user details (includes cached astrology data from database)
        const response = await api.request(`/client/users/${user.value._id}/complete-details`, { token });
        
        if (response?.data) {
          // Astrology data (from database cache)
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
        console.error('Error fetching kundali data:', err);
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
        
        const response = await api.request(`/client/users/${user.value._id}/panchang`, { token });
        // Backend returns: { success, source, data }
        // api.request returns it directly (no wrapper)
        if (response?.data) {
          panchangData.value = { data: response.data, source: response.source };
        }
      } catch (err) {
        console.error('Error fetching panchang data:', err);
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
        // api.post wraps response in { data: response }
        // Backend returns: { success, source, data }
        // So we get: { data: { success, source, data } }
        if (response?.data?.data) {
          numerologyData.value = { data: response.data.data, source: response.data.source };
        }
      } catch (err) {
        console.error('Error fetching numerology data:', err);
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
      <div class="kundali-page">
        <style>{`
          .kundali-page {
            padding: 0;
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
          }

          .kundali-header {
            background: white;
            padding: 1rem;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            margin: 1rem;
            margin-bottom: 1.5rem;
          }

          .header-content {
            display: grid;
            grid-template-columns: 40px 1fr 40px;
            align-items: center;
            gap: 0.75rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .back-btn {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border: none;
            border-radius: 10px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
          }

          .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          }

          .header-title {
            text-align: center;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }

          .header-icon {
            width: 2.25rem;
            height: 2.25rem;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
            flex-shrink: 0;
          }

          .header-text {
            display: flex;
            flex-direction: column;
            gap: 0.15rem;
          }

          .header-title h1 {
            margin: 0;
            font-size: 1.35rem;
            font-weight: 700;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-align: left;
          }

          .header-title p {
            margin: 0;
            font-size: 0.8rem;
            color: #64748b;
            font-weight: 500;
            text-align: left;
          }

          .content-wrapper {
            padding: 0 1rem 1rem 1rem;
            max-width: 1200px;
            margin: 0 auto;
          }

          .tabs {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
            background: white;
            padding: 0.5rem;
            border-radius: 16px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }

          .tab {
            flex: 1;
            padding: 0.875rem;
            border: none;
            border-radius: 12px;
            background: transparent;
            color: #64748b;
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .tab:hover {
            background: #f1f5f9;
            color: #6366f1;
          }

          .tab.active {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          }

          .kundali-card {
            background: white;
            border-radius: 20px;
            padding: 1.75rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(99, 102, 241, 0.1);
          }

          .card-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .card-title::before {
            content: '';
            width: 4px;
            height: 24px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 2px;
          }

          .data-text {
            font-size: 0.95rem;
            color: #475569;
            line-height: 1.7;
            margin-bottom: 0.75rem;
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 10px;
            border-left: 3px solid #6366f1;
          }

          .data-text strong {
            color: #1e293b;
            font-weight: 600;
          }

          .coming-soon {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            border: 2px dashed #f59e0b;
          }

          .coming-soon p {
            margin: 0;
            color: #92400e;
            font-weight: 600;
            font-size: 0.95rem;
          }

          .spinner-border {
            width: 3rem;
            height: 3rem;
            border: 0.3rem solid #e0e7ff;
            border-right-color: #6366f1;
            border-radius: 50%;
            animation: spinner-border 0.75s linear infinite;
          }

          @keyframes spinner-border {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 480px) {
            .kundali-header {
              padding: 0.875rem 0.75rem;
              border-radius: 20px;
              margin: 0.75rem;
            }

            .header-icon {
              width: 2rem;
              height: 2rem;
            }

            .header-content {
              grid-template-columns: 36px 1fr 36px;
              gap: 0.5rem;
            }

            .back-btn {
              width: 36px;
              height: 36px;
            }

            .content-wrapper {
              padding: 0 0.75rem 0.75rem 0.75rem;
            }

            .kundali-card {
              padding: 1.25rem;
            }

            .header-title h1 {
              font-size: 1.2rem;
            }

            .header-title p {
              font-size: 0.75rem;
            }

            .tab {
              padding: 0.625rem;
              font-size: 0.85rem;
            }

            .card-title {
              font-size: 1.1rem;
            }
          }
        `}</style>

        {/* Header */}
        <div class="kundali-header">
          <div class="header-content">
            <button onClick={goBack} class="back-btn">
              <ArrowLeftIcon style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </button>
            <div class="header-title">
              <div class="header-icon">
                <StarIcon style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
              </div>
              <div class="header-text">
                <h1>My Kundali</h1>
                <p>Discover your cosmic insights</p>
              </div>
            </div>
          </div>
        </div>

        <div class="content-wrapper">
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

          {/* Loading */}
          {loading.value && (
            <div class="kundali-card">
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div class="spinner-border" role="status">
                  <span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>Loading...</span>
                </div>
              </div>
            </div>
          )}

          {/* Astro Tab */}
          {!loading.value && activeTab.value === 'astro' && (
            <div class="kundali-card">
              {kundaliData.value ? (
                <AstroDetails data={kundaliData.value} />
              ) : error.value ? (
                <div class="coming-soon">
                  <p>⚠️ {error.value}</p>
                </div>
              ) : (
                <div class="coming-soon">
                  <p>✨ Please update your birth details in profile to see astrology data</p>
                </div>
              )}
            </div>
          )}

          {/* Numerology Tab */}
          {!loading.value && activeTab.value === 'numerology' && (
            <div class="kundali-card">
              {numerologyData.value?.error ? (
                <div class="coming-soon">
                  <p>🔢 {numerologyData.value.message}</p>
                </div>
              ) : numerologyData.value?.data ? (
                <NumerologyView data={numerologyData.value.data} />
              ) : (
                <div class="coming-soon">
                  <p>🔢 Loading numerology data...</p>
                </div>
              )}
            </div>
          )}

          {/* Panchang Tab */}
          {!loading.value && activeTab.value === 'panchang' && (
            <div class="kundali-card">
              {panchangData.value?.error ? (
                <div class="coming-soon">
                  <p>📅 {panchangData.value.message}</p>
                </div>
              ) : panchangData.value?.data ? (
                <PanchangView data={panchangData.value.data} />
              ) : (
                <div class="coming-soon">
                  <p>📅 Loading panchang data...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
};
