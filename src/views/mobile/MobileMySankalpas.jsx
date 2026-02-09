import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, SparklesIcon, CalendarIcon, FireIcon, CheckCircleIcon, ClockIcon, BellIcon } from '@heroicons/vue/24/outline';
import userSankalpService from '../../services/userSankalpService';
import notificationService from '../../services/notificationService';

export default {
  name: 'MobileMySankalpas',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const activeTab = ref('active');
    const sankalpas = ref([]);
    const unreadCount = ref(0);

    const goBack = () => router.back();

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        unreadCount.value = response.data || 0;
      } catch (error) {
        // Silent fail
      }
    };

    const fetchMySankalpas = async () => {
      loading.value = true;
      try {
        const response = await userSankalpService.getMySankalpas(activeTab.value);
        sankalpas.value = response.data || [];
      } catch (error) {
        console.error('Error:', error);
        sankalpas.value = [];
      } finally {
        loading.value = false;
      }
    };

    const switchTab = (tab) => {
      activeTab.value = tab;
      fetchMySankalpas();
    };

    const viewProgress = (userSankalp) => {
      router.push(`/mobile/user/sankalpas/progress/${userSankalp._id}`);
    };

    const getProgressPercentage = (userSankalp) => {
      const yesCount = userSankalp.dailyReports.filter(r => r.status === 'yes').length;
      return Math.round((yesCount / userSankalp.totalDays) * 100);
    };

    onMounted(() => {
      fetchMySankalpas();
      fetchUnreadCount();
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
            margin-bottom: 1rem;
            position: relative;
          }
          .back-button {
            background: transparent;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
          }
          .notification-bell {
            background: transparent;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            position: absolute;
            right: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .bell-icon {
            width: 1.5rem;
            height: 1.5rem;
            color: #1f2937;
          }
          .notification-badge {
            position: absolute;
            top: 0.25rem;
            right: 0.25rem;
            background: #ef4444;
            color: white;
            font-size: 0.625rem;
            font-weight: 700;
            padding: 0.125rem 0.375rem;
            border-radius: 10px;
            min-width: 16px;
            text-align: center;
          }
          .back-icon {
            width: 1.5rem;
            height: 1.5rem;
            color: #1f2937;
          }
          .page-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
          }
          .tabs {
            display: flex;
            gap: 0.5rem;
          }
          .tab {
            flex: 1;
            padding: 0.625rem;
            background: #f3f4f6;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s;
          }
          .tab.active {
            background: #9333ea;
            color: white;
          }
          .sankalpas-list {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .sankalp-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            cursor: pointer;
            transition: transform 0.2s;
          }
          .sankalp-card:active {
            transform: scale(0.98);
          }
          .card-banner {
            height: 120px;
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          .card-banner img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .banner-icon {
            width: 2.5rem;
            height: 2.5rem;
            color: rgba(255, 255, 255, 0.9);
          }
          .status-badge {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.95);
          }
          .status-active {
            color: #16a34a;
          }
          .status-completed {
            color: #3b82f6;
          }
          .status-abandoned {
            color: #ef4444;
          }
          .card-content {
            padding: 1rem;
          }
          .card-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
          .card-category {
            display: inline-block;
            background: #f3e8ff;
            color: #9333ea;
            padding: 0.25rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
          }
          .progress-section {
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 0.75rem;
          }
          .progress-bar-container {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 0.5rem;
          }
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #16a34a 100%);
            transition: width 0.3s;
          }
          .progress-text {
            font-size: 0.75rem;
            color: #6b7280;
            display: flex;
            justify-content: space-between;
          }
          .stats-row {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
          }
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            font-size: 0.8125rem;
            color: #6b7280;
          }
          .stat-icon {
            width: 1rem;
            height: 1rem;
            color: #9333ea;
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
          .empty-state {
            text-align: center;
            padding: 4rem 1.5rem;
          }
          .empty-icon {
            width: 4rem;
            height: 4rem;
            color: #d1d5db;
            margin: 0 auto 1.5rem;
          }
          .empty-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #6b7280;
            margin-bottom: 0.75rem;
          }
          .empty-text {
            color: #9ca3af;
            font-size: 0.875rem;
          }
        `}</style>

        <div class="header">
          <div class="header-top">
            <button class="back-button" onClick={goBack}>
              <ArrowLeftIcon class="back-icon" />
            </button>
            <h1 class="page-title">My Sankalpas</h1>
            <button class="notification-bell" onClick={() => router.push('/mobile/user/notifications')}>
              <BellIcon class="bell-icon" />
              {unreadCount.value > 0 && (
                <span class="notification-badge">{unreadCount.value > 99 ? '99+' : unreadCount.value}</span>
              )}
            </button>
          </div>
          <div class="tabs">
            <button 
              class={`tab ${activeTab.value === 'active' ? 'active' : ''}`}
              onClick={() => switchTab('active')}
            >
              Active
            </button>
            <button 
              class={`tab ${activeTab.value === 'completed' ? 'active' : ''}`}
              onClick={() => switchTab('completed')}
            >
              Completed
            </button>
            <button 
              class={`tab ${activeTab.value === 'abandoned' ? 'active' : ''}`}
              onClick={() => switchTab('abandoned')}
            >
              Abandoned
            </button>
          </div>
        </div>

        {loading.value ? (
          <div style="display: flex; justify-content: center; align-items: center; padding: 5rem;">
            <div class="loading-spinner"></div>
          </div>
        ) : sankalpas.value.length === 0 ? (
          <div class="empty-state">
            <SparklesIcon class="empty-icon" />
            <h2 class="empty-title">No {activeTab.value} sankalpas</h2>
            <p class="empty-text">
              {activeTab.value === 'active' 
                ? 'Join a sankalp to start your spiritual journey' 
                : `You don't have any ${activeTab.value} sankalpas yet`}
            </p>
          </div>
        ) : (
          <div class="sankalpas-list">
            {sankalpas.value.map(us => (
              <div key={us._id} class="sankalp-card" onClick={() => viewProgress(us)}>
                <div class="card-banner">
                  {us.sankalpId?.bannerImage ? (
                    <img src={us.sankalpId.bannerImage} alt={us.sankalpId.title} />
                  ) : (
                    <SparklesIcon class="banner-icon" />
                  )}
                  <span class={`status-badge status-${us.status}`}>
                    {us.status === 'active' ? '🔥 Active' : us.status === 'completed' ? '✅ Completed' : '❌ Abandoned'}
                  </span>
                </div>

                <div class="card-content">
                  <h3 class="card-title">{us.sankalpId?.title}</h3>
                  <span class="card-category">{us.sankalpId?.category}</span>

                  <div class="progress-section">
                    <div class="progress-bar-container">
                      <div class="progress-bar" style={`width: ${getProgressPercentage(us)}%`}></div>
                    </div>
                    <div class="progress-text">
                      <span>Day {us.currentDay}/{us.totalDays}</span>
                      <span>{getProgressPercentage(us)}% Complete</span>
                    </div>
                  </div>

                  <div class="stats-row">
                    <div class="stat-item">
                      <FireIcon class="stat-icon" />
                      <span>{us.karmaEarned} karma earned</span>
                    </div>
                    {us.status === 'completed' && (
                      <div class="stat-item">
                        <CheckCircleIcon class="stat-icon" />
                        <span>+{us.completionBonusEarned} bonus</span>
                      </div>
                    )}
                    {us.status === 'active' && (
                      <div class="stat-item">
                        <ClockIcon class="stat-icon" />
                        <span>{us.totalDays - us.currentDay + 1} days left</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};
