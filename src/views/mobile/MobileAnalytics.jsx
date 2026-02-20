import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, ChartBarIcon, SparklesIcon, TrophyIcon, FireIcon, CheckCircleIcon } from '@heroicons/vue/24/outline';
import analyticsService from '../../services/analyticsService';

export default {
  name: 'MobileAnalytics',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const analytics = ref(null);

    const goBack = () => router.back();

    const fetchAnalytics = async () => {
      loading.value = true;
      try {
        const response = await analyticsService.getSankalpAnalytics();
        analytics.value = response.data;
      } catch (error) {
        console.error('Error:', error);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchAnalytics();
    });

    return () => (
      <div class="page-container">
        <style>{`
          .page-container {
            min-height: 100vh;
            background: linear-gradient(to bottom, #faf5ff 0%, #f3e8ff 100%);
            padding-bottom: 5rem;
          }
          .header {
            background: white;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .header-top {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .back-button {
            background: transparent;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
          }
          .back-icon {
            width: 1.5rem;
            height: 1.5rem;
            color: #1f2937;
          }
          .page-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1f2937;
          }
          .content {
            padding: 1rem;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.25rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .stat-icon {
            width: 2.5rem;
            height: 2.5rem;
            padding: 0.5rem;
            border-radius: 10px;
            margin-bottom: 0.75rem;
          }
          .stat-value {
            font-size: 2rem;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 0.25rem;
          }
          .stat-label {
            font-size: 0.8125rem;
            color: #6b7280;
            font-weight: 600;
          }
          .progress-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .progress-title {
            font-size: 1rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1rem;
          }
          .progress-item {
            margin-bottom: 1.25rem;
          }
          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .progress-name {
            color: #6b7280;
            font-weight: 600;
          }
          .progress-percent {
            color: #9333ea;
            font-weight: 700;
          }
          .progress-bar-container {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #9333ea 0%, #7e22ce 100%);
            transition: width 0.3s;
          }
          .loading-spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid #f3e8ff;
            border-top-color: #9333ea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div class="header">
          <div class="header-top">
            <button class="back-button" onClick={goBack}>
              <ArrowLeftIcon class="back-icon" />
            </button>
            <h1 class="page-title">My Analytics</h1>
          </div>
        </div>

        {loading.value ? (
          <div style="display: flex; justify-content: center; align-items: center; padding: 5rem;">
            <div class="loading-spinner"></div>
          </div>
        ) : analytics.value ? (
          <div class="content">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon" style="background: #ecfdf5; color: #10b981;">
                  <TrophyIcon style="width: 100%; height: 100%;" />
                </div>
                <div class="stat-value">{analytics.value.totalJoined}</div>
                <div class="stat-label">Total Joined</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon" style="background: #dbeafe; color: #3b82f6;">
                  <CheckCircleIcon style="width: 100%; height: 100%;" />
                </div>
                <div class="stat-value">{analytics.value.completed}</div>
                <div class="stat-label">Completed</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon" style="background: #fef3c7; color: #f59e0b;">
                  <FireIcon style="width: 100%; height: 100%;" />
                </div>
                <div class="stat-value">{analytics.value.active}</div>
                <div class="stat-label">Active</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon" style="background: #f3e8ff; color: #9333ea;">
                  <SparklesIcon style="width: 100%; height: 100%;" />
                </div>
                <div class="stat-value">{analytics.value.totalKarmaEarned}</div>
                <div class="stat-label">Karma Earned</div>
              </div>
            </div>

            <div class="progress-card">
              <h3 class="progress-title">Performance Metrics</h3>
              
              <div class="progress-item">
                <div class="progress-label">
                  <span class="progress-name">Success Rate</span>
                  <span class="progress-percent">{analytics.value.successRate}%</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" style={`width: ${analytics.value.successRate}%`}></div>
                </div>
              </div>
              
              <div class="progress-item">
                <div class="progress-label">
                  <span class="progress-name">Consistency</span>
                  <span class="progress-percent">{analytics.value.consistency}%</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" style={`width: ${analytics.value.consistency}%`}></div>
                </div>
              </div>
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value" style="color: #10b981;">{analytics.value.totalYes}</div>
                <div class="stat-label">Days Completed</div>
              </div>
              
              <div class="stat-card">
                <div class="stat-value" style="color: #ef4444;">{analytics.value.totalNo}</div>
                <div class="stat-label">Days Missed</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
};
