import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, SparklesIcon, CalendarIcon, UsersIcon, FireIcon, BellIcon, MagnifyingGlassIcon, XMarkIcon, TrophyIcon, ChartBarIcon, CheckCircleIcon, ClockIcon } from '@heroicons/vue/24/outline';
import sankalpService from '../../services/sankalpService';
import userSankalpService from '../../services/userSankalpService';
import leaderboardService from '../../services/leaderboardService';
import analyticsService from '../../services/analyticsService';
import notificationService from '../../services/notificationService';

export default {
  name: 'MobileSankalpas',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const activeTab = ref('all');
    const sankalpas = ref([]);
    const mySankalpas = ref([]);
    const mySankalpTab = ref('active');
    const leaderboardTab = ref('sankalpas');
    const sankalpLeaderboard = ref([]);
    const karmaLeaderboard = ref([]);
    const analytics = ref(null);
    const unreadCount = ref(0);
    const searchQuery = ref('');

    const goBack = () => {
      router.back();
    };

    const fetchUnreadCount = async () => {
      try {
        const response = await notificationService.getUnreadCount();
        unreadCount.value = response.data || 0;
      } catch (error) {
        // Silent fail
      }
    };

    const fetchSankalpas = async () => {
      loading.value = true;
      try {
        const params = {};
        if (searchQuery.value) params.search = searchQuery.value;
        
        const response = await sankalpService.getAll(params);
        const data = response.data || response || [];
        sankalpas.value = Array.isArray(data) ? data.filter(s => s.status === 'Active' && s.visibility === 'Public') : [];
      } catch (error) {
        console.error('Error fetching sankalpas:', error);
        sankalpas.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchMySankalpas = async () => {
      loading.value = true;
      try {
        const response = await userSankalpService.getMySankalpas(mySankalpTab.value);
        mySankalpas.value = response.data || [];
      } catch (error) {
        console.error('Error:', error);
        mySankalpas.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchLeaderboards = async () => {
      loading.value = true;
      try {
        const [sankalpRes, karmaRes] = await Promise.all([
          leaderboardService.getSankalpLeaderboard(20),
          leaderboardService.getKarmaLeaderboard(20)
        ]);
        sankalpLeaderboard.value = sankalpRes.data || [];
        karmaLeaderboard.value = karmaRes.data || [];
      } catch (error) {
        console.error('Error:', error);
        sankalpLeaderboard.value = [];
        karmaLeaderboard.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchAnalytics = async () => {
      loading.value = true;
      try {
        const response = await analyticsService.getSankalpAnalytics();
        analytics.value = response.data || {};
      } catch (error) {
        console.error('Error:', error);
        analytics.value = null;
      } finally {
        loading.value = false;
      }
    };

    const handleSearch = () => {
      fetchSankalpas();
    };

    const clearSearch = () => {
      searchQuery.value = '';
      fetchSankalpas();
    };

    const viewDetails = (sankalp) => {
      router.push(`/mobile/user/sankalpas/${sankalp._id}`);
    };

    const viewProgress = (userSankalp) => {
      router.push(`/mobile/user/sankalpas/progress/${userSankalp._id}`);
    };

    const getProgressPercentage = (userSankalp) => {
      if (!userSankalp?.dailyReports || !userSankalp?.totalDays) return 0;
      const yesCount = userSankalp.dailyReports.filter(r => r.status === 'yes').length;
      return Math.round((yesCount / userSankalp.totalDays) * 100);
    };

    const getMedalIcon = (rank) => {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return `#${rank}`;
    };

    const switchTab = (tab) => {
      activeTab.value = tab;
      if (tab === 'all') fetchSankalpas();
      else if (tab === 'my') {
        if (mySankalpas.value.length === 0) loading.value = true;
        fetchMySankalpas();
      }
      else if (tab === 'leaderboard') {
        if (sankalpLeaderboard.value.length === 0 && karmaLeaderboard.value.length === 0) loading.value = true;
        fetchLeaderboards();
      }
      else if (tab === 'analytics') {
        if (!analytics.value) loading.value = true;
        fetchAnalytics();
      }
    };

    onMounted(() => {
      fetchSankalpas();
      fetchUnreadCount();
    });

    return () => (
      <div class="page-container">
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
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
            justify-content: center;
            gap: 0.75rem;
            position: relative;
            margin-bottom: 1rem;
          }
          
          .main-tabs {
            display: flex;
            gap: 0.5rem;
            overflow-x: auto;
          }
          
          .main-tab {
            flex: 1;
            padding: 0.625rem;
            background: #f3f4f6;
            border: none;
            border-radius: 8px;
            font-size: 0.8125rem;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.375rem;
            white-space: nowrap;
          }
          
          .main-tab.active {
            background: #9333ea;
            color: white;
          }
          
          .tab-icon {
            width: 1rem;
            height: 1rem;
          }
          
          .back-button {
            background: transparent;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            position: absolute;
            left: 0;
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
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          
          .title-icon {
            width: 1.5rem;
            height: 1.5rem;
            color: #9333ea;
          }
          
          .sankalpas-list {
            padding: 1rem;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            max-width: 100%;
          }
          
          .sankalp-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            transition: transform 0.2s;
            max-width: 100%;
          }
          
          .card-banner {
            height: 140px;
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .card-banner img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .banner-icon {
            width: 3rem;
            height: 3rem;
            color: rgba(255, 255, 255, 0.9);
          }
          
          .card-content {
            padding: 1rem;
          }
          
          .card-header {
            margin-bottom: 0.75rem;
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
          }
          
          .card-description {
            color: #6b7280;
            line-height: 1.6;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
          
          .karma-highlight {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #86efac;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .karma-item {
            display: flex;
            align-items: center;
            gap: 0.375rem;
          }
          
          .karma-text {
            color: #16a34a;
            font-weight: 700;
            font-size: 0.8125rem;
          }
          
          .card-stats {
            display: flex;
            gap: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #f3f4f6;
            flex-wrap: wrap;
          }
          
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            color: #6b7280;
          }
          
          .stat-icon {
            width: 1rem;
            height: 1rem;
            color: #9333ea;
          }
          
          .loading {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 5rem 1rem;
            gap: 1rem;
          }
          
          .spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid #f3e8ff;
            border-top-color: #9333ea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          
          .loading-text {
            color: #9333ea;
            font-weight: 600;
            font-size: 0.875rem;
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
            line-height: 1.5;
          }
          
          .search-filter-section {
            padding: 1rem;
          }
          
          .search-box {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 0.75rem 1rem;
          }
          
          .search-icon {
            width: 1.25rem;
            height: 1.25rem;
            color: #9ca3af;
            flex-shrink: 0;
          }
          
          .search-input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 0.875rem;
            color: #1f2937;
            outline: none;
          }
          
          .search-input::placeholder {
            color: #9ca3af;
          }
          
          .clear-search-btn {
            background: transparent;
            border: none;
            padding: 0.25rem;
            cursor: pointer;
            display: flex;
            align-items: center;
          }
          
          .clear-icon {
            width: 1.125rem;
            height: 1.125rem;
            color: #6b7280;
          }
          
          .filter-row {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }
          
          .filter-btn {
            display: flex;
            align-items: center;
            gap: 0.375rem;
            padding: 0.5rem 0.875rem;
            background: #f3e8ff;
            color: #9333ea;
            border: 2px solid #e9d5ff;
            border-radius: 8px;
            font-size: 0.8125rem;
            font-weight: 600;
            cursor: pointer;
            position: relative;
          }
          
          .filter-icon {
            width: 1rem;
            height: 1rem;
          }
          
          .filter-badge {
            position: absolute;
            top: -6px;
            right: -6px;
            background: #ef4444;
            color: white;
            font-size: 0.625rem;
            font-weight: 700;
            padding: 0.125rem 0.375rem;
            border-radius: 10px;
            min-width: 16px;
            text-align: center;
          }
          
          .filter-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: flex-end;
          }
          
          .filter-content {
            background: white;
            border-radius: 20px 20px 0 0;
            padding: 1.5rem;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
          }
          
          .filter-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
          }
          
          .filter-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1f2937;
          }
          
          .close-filter-btn {
            background: transparent;
            border: none;
            padding: 0.25rem;
            cursor: pointer;
          }
          
          .filter-section {
            margin-bottom: 1.5rem;
          }
          
          .filter-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.75rem;
            display: block;
          }
          
          .category-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
          }
          
          .category-chip {
            padding: 0.625rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            color: #6b7280;
            font-size: 0.8125rem;
            font-weight: 600;
            cursor: pointer;
            text-align: center;
            transition: all 0.2s;
          }
          
          .category-chip.active {
            background: #f3e8ff;
            border-color: #9333ea;
            color: #9333ea;
          }
          
          .sort-options {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .sort-option {
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            color: #6b7280;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s;
          }
          
          .sort-option.active {
            background: #f3e8ff;
            border-color: #9333ea;
            color: #9333ea;
          }
          
          .filter-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
          }
          
          .clear-filters-btn {
            flex: 1;
            padding: 0.875rem;
            border: 2px solid #e5e7eb;
            background: white;
            color: #6b7280;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          
          .apply-filters-btn {
            flex: 1;
            padding: 0.875rem;
            border: none;
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            color: white;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
          }
          
          @media (max-width: 480px) {
            .page-title {
              font-size: 1.125rem;
            }
            
            .sankalpas-list {
              grid-template-columns: repeat(2, 1fr);
              padding: 0.75rem;
              gap: 0.75rem;
            }
            
            .card-content {
              padding: 0.875rem;
            }
            
            .card-banner {
              height: 120px;
            }
            
            .banner-icon {
              width: 2.5rem;
              height: 2.5rem;
            }
            
            .card-title {
              font-size: 1rem;
            }
            
            .card-description {
              font-size: 0.8125rem;
            }
            
            .karma-highlight {
              padding: 0.625rem;
            }
            
            .karma-text {
              font-size: 0.75rem;
            }
            
            .stat-item {
              font-size: 0.75rem;
            }
          }
          
          @media (max-width: 360px) {
            .header {
              padding: 0.875rem;
            }
            
            .page-title {
              font-size: 1rem;
            }
            
            .sankalpas-list {
              grid-template-columns: 1fr;
              padding: 0.5rem;
              gap: 0.75rem;
            }
            
            .card-banner {
              height: 100px;
            }
            
            .card-content {
              padding: 0.75rem;
            }
            
            .karma-highlight {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
        
        <div class="header">
          <div class="header-top">
            <button class="back-button" onClick={goBack}>
              <ArrowLeftIcon class="back-icon" />
            </button>
            <h1 class="page-title">
              <SparklesIcon class="title-icon" />
              Sankalp
            </h1>
            <button class="notification-bell" onClick={() => router.push('/mobile/user/notifications')}>
              <BellIcon class="bell-icon" />
              {unreadCount.value > 0 && (
                <span class="notification-badge">{unreadCount.value > 99 ? '99+' : unreadCount.value}</span>
              )}
            </button>
          </div>
          
          <div class="main-tabs">
            <button class={`main-tab ${activeTab.value === 'all' ? 'active' : ''}`} onClick={() => switchTab('all')}>
              <SparklesIcon class="tab-icon" /> All
            </button>
            <button class={`main-tab ${activeTab.value === 'my' ? 'active' : ''}`} onClick={() => switchTab('my')}>
              <CalendarIcon class="tab-icon" /> My
            </button>
            <button class={`main-tab ${activeTab.value === 'leaderboard' ? 'active' : ''}`} onClick={() => switchTab('leaderboard')}>
              <TrophyIcon class="tab-icon" /> Rank
            </button>
            <button class={`main-tab ${activeTab.value === 'analytics' ? 'active' : ''}`} onClick={() => switchTab('analytics')}>
              <ChartBarIcon class="tab-icon" /> Stats
            </button>
          </div>
        </div>
        
        {activeTab.value === 'all' && (
          <>
            <div class="search-filter-section">
              <div class="search-box">
                <MagnifyingGlassIcon class="search-icon" />
                <input 
                  type="text" 
                  class="search-input" 
                  placeholder="Search sankalpas..."
                  v-model={searchQuery.value}
                  onKeyup={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searchQuery.value && (
                  <button class="clear-search-btn" onClick={clearSearch}>
                    <XMarkIcon class="clear-icon" />
                  </button>
                )}
              </div>
            </div>
            
            {loading.value ? (
              <div class="loading">
                <div class="spinner"></div>
                <p class="loading-text">Loading...</p>
              </div>
            ) : sankalpas.value.length === 0 ? (
              <div class="empty-state">
                <SparklesIcon class="empty-icon" />
                <h2 class="empty-title">No Sankalpas Available</h2>
                <p class="empty-text">Check back later for new spiritual resolutions to join</p>
              </div>
            ) : (
              <div class="sankalpas-list">
              {sankalpas.value.map(sankalp => (
                <div key={sankalp._id} class="sankalp-card" onClick={() => viewDetails(sankalp)}>
                  <div class="card-banner">
                    {sankalp.bannerImage ? (
                      <img src={sankalp.bannerImage} alt={sankalp.title} />
                    ) : (
                      <SparklesIcon class="banner-icon" />
                    )}
                  </div>
                  
                  <div class="card-content">
                    <div class="card-header">
                      <h3 class="card-title">{sankalp.title}</h3>
                      <span class="card-category">{sankalp.category}</span>
                    </div>
                    
                    <p class="card-description">{sankalp.description}</p>
                    
                    <div class="karma-highlight">
                      <div class="karma-item">
                        <FireIcon style="width: 1.125rem; height: 1.125rem; color: #16a34a;" />
                        <span class="karma-text">{sankalp.karmaPointsPerDay} pts/day</span>
                      </div>
                      <div class="karma-item">
                        <SparklesIcon style="width: 1.125rem; height: 1.125rem; color: #16a34a;" />
                        <span class="karma-text">+{sankalp.completionBonusKarma} bonus</span>
                      </div>
                    </div>
                    
                    <div class="card-stats">
                      <div class="stat-item">
                        <CalendarIcon class="stat-icon" />
                        <span>{sankalp.totalDays} days</span>
                      </div>
                      <div class="stat-item">
                        <UsersIcon class="stat-icon" />
                        <span>{sankalp.participantsCount} joined</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </>
        )}
        
        {/* My Sankalpas Tab */}
        {activeTab.value === 'my' && (
          <div style="padding: 1rem;">
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
              <button 
                style={`flex: 1; padding: 0.625rem; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; background: ${mySankalpTab.value === 'active' ? '#9333ea' : '#f3f4f6'}; color: ${mySankalpTab.value === 'active' ? 'white' : '#6b7280'};`}
                onClick={() => { mySankalpTab.value = 'active'; fetchMySankalpas(); }}
              >
                Active
              </button>
              <button 
                style={`flex: 1; padding: 0.625rem; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; background: ${mySankalpTab.value === 'completed' ? '#9333ea' : '#f3f4f6'}; color: ${mySankalpTab.value === 'completed' ? 'white' : '#6b7280'};`}
                onClick={() => { mySankalpTab.value = 'completed'; fetchMySankalpas(); }}
              >
                Completed
              </button>
              <button 
                style={`flex: 1; padding: 0.625rem; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; background: ${mySankalpTab.value === 'abandoned' ? '#9333ea' : '#f3f4f6'}; color: ${mySankalpTab.value === 'abandoned' ? 'white' : '#6b7280'};`}
                onClick={() => { mySankalpTab.value = 'abandoned'; fetchMySankalpas(); }}
              >
                Abandoned
              </button>
            </div>
            
            {mySankalpas.value.length === 0 ? (
              <div class="empty-state">
                <SparklesIcon class="empty-icon" />
                <h2 class="empty-title">No {mySankalpTab.value} sankalpas</h2>
              </div>
            ) : (
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                {mySankalpas.value.map(us => (
                  <div key={us._id} class="sankalp-card" onClick={() => viewProgress(us)}>
                    <div class="card-banner" style="position: relative;">
                      {us.sankalpId?.bannerImage ? (
                        <img src={us.sankalpId.bannerImage} alt={us.sankalpId.title} />
                      ) : (
                        <SparklesIcon class="banner-icon" />
                      )}
                      <span style={`position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; background: rgba(255,255,255,0.95); color: ${us.status === 'active' ? '#16a34a' : us.status === 'completed' ? '#3b82f6' : '#ef4444'};`}>
                        {us.status === 'active' ? '🔥 Active' : us.status === 'completed' ? '✅ Completed' : '❌ Abandoned'}
                      </span>
                    </div>
                    <div class="card-content">
                      <h3 class="card-title">{us.sankalpId?.title}</h3>
                      <span class="card-category">{us.sankalpId?.category}</span>
                      <div style="background: #f9fafb; padding: 0.75rem; border-radius: 8px; margin: 0.75rem 0;">
                        <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem;">
                          <div style={`height: 100%; background: linear-gradient(90deg, #10b981 0%, #16a34a 100%); width: ${getProgressPercentage(us)}%;`}></div>
                        </div>
                        <div style="font-size: 0.75rem; color: #6b7280; display: flex; justify-content: space-between;">
                          <span>Day {us.currentDay}/{us.totalDays}</span>
                          <span>{getProgressPercentage(us)}% Complete</span>
                        </div>
                      </div>
                      <div class="card-stats">
                        <div class="stat-item">
                          <FireIcon class="stat-icon" />
                          <span>{us.karmaEarned} karma</span>
                        </div>
                        {us.status === 'completed' && (
                          <div class="stat-item">
                            <CheckCircleIcon class="stat-icon" />
                            <span>+{us.completionBonusEarned} bonus</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Leaderboard Tab */}
        {activeTab.value === 'leaderboard' && (
          <div style="padding: 1rem;">
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
              <button 
                style={`flex: 1; padding: 0.75rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: ${leaderboardTab.value === 'sankalpas' ? 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' : '#f3f4f6'}; color: ${leaderboardTab.value === 'sankalpas' ? 'white' : '#6b7280'};`}
                onClick={() => leaderboardTab.value = 'sankalpas'}
              >
                <TrophyIcon style="width: 1.125rem; height: 1.125rem;" /> Sankalpas
              </button>
              <button 
                style={`flex: 1; padding: 0.75rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: ${leaderboardTab.value === 'karma' ? 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)' : '#f3f4f6'}; color: ${leaderboardTab.value === 'karma' ? 'white' : '#6b7280'};`}
                onClick={() => leaderboardTab.value = 'karma'}
              >
                <SparklesIcon style="width: 1.125rem; height: 1.125rem;" /> Karma
              </button>
            </div>
            
            {leaderboardTab.value === 'sankalpas' ? (
              sankalpLeaderboard.value.length > 0 ? (
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  {sankalpLeaderboard.value.map(entry => (
                    <div key={entry.user._id} style="background: white; border-radius: 12px; padding: 1rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                      <div style="font-size: 1.5rem; font-weight: 800; min-width: 3rem; text-align: center;">{getMedalIcon(entry.rank)}</div>
                      <div style="flex: 1;">
                        <div style="font-size: 1rem; font-weight: 700; color: #1f2937; margin-bottom: 0.25rem;">{entry.user.name}</div>
                        <div style="font-size: 0.8125rem; color: #6b7280;">
                          <FireIcon style="width: 0.875rem; height: 0.875rem; display: inline; color: #f59e0b;" /> {entry.totalKarmaFromSankalpas} karma
                        </div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: 800; color: #9333ea;">{entry.completedSankalpas}</div>
                        <div style="font-size: 0.6875rem; color: #6b7280; font-weight: 600;">Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="empty-state">
                  <TrophyIcon class="empty-icon" />
                  <p class="empty-text">No data available</p>
                </div>
              )
            ) : (
              karmaLeaderboard.value.length > 0 ? (
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  {karmaLeaderboard.value.map(entry => (
                    <div key={entry.user._id} style="background: white; border-radius: 12px; padding: 1rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                      <div style="font-size: 1.5rem; font-weight: 800; min-width: 3rem; text-align: center;">{getMedalIcon(entry.rank)}</div>
                      <div style="flex: 1;">
                        <div style="font-size: 1rem; font-weight: 700; color: #1f2937;">{entry.user.name}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="font-size: 1.25rem; font-weight: 800; color: #9333ea;">{entry.user.karmaPoints}</div>
                        <div style="font-size: 0.6875rem; color: #6b7280; font-weight: 600;">Karma</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="empty-state">
                  <SparklesIcon class="empty-icon" />
                  <p class="empty-text">No data available</p>
                </div>
              )
            )}
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab.value === 'analytics' && (
          loading.value ? (
            <div class="loading">
              <div class="spinner"></div>
              <p class="loading-text">Loading...</p>
            </div>
          ) : !analytics.value ? (
            <div class="empty-state">
              <ChartBarIcon class="empty-icon" />
              <h2 class="empty-title">No Analytics Available</h2>
              <p class="empty-text">Complete some sankalpas to see your statistics</p>
            </div>
          ) : (
          <div style="padding: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem;">
              <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                <div style="width: 2.5rem; height: 2.5rem; padding: 0.5rem; border-radius: 10px; margin-bottom: 0.75rem; background: #ecfdf5; color: #10b981;">
                  <TrophyIcon style="width: 100%; height: 100%;" />
                </div>
                <div style="font-size: 2rem; font-weight: 800; color: #1f2937; margin-bottom: 0.25rem;">{analytics.value.totalJoined || 0}</div>
                <div style="font-size: 0.8125rem; color: #6b7280; font-weight: 600;">Total Joined</div>
              </div>
              <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                <div style="width: 2.5rem; height: 2.5rem; padding: 0.5rem; border-radius: 10px; margin-bottom: 0.75rem; background: #dbeafe; color: #3b82f6;">
                  <CheckCircleIcon style="width: 100%; height: 100%;" />
                </div>
                <div style="font-size: 2rem; font-weight: 800; color: #1f2937; margin-bottom: 0.25rem;">{analytics.value.completed || 0}</div>
                <div style="font-size: 0.8125rem; color: #6b7280; font-weight: 600;">Completed</div>
              </div>
              <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                <div style="width: 2.5rem; height: 2.5rem; padding: 0.5rem; border-radius: 10px; margin-bottom: 0.75rem; background: #fef3c7; color: #f59e0b;">
                  <FireIcon style="width: 100%; height: 100%;" />
                </div>
                <div style="font-size: 2rem; font-weight: 800; color: #1f2937; margin-bottom: 0.25rem;">{analytics.value.active || 0}</div>
                <div style="font-size: 0.8125rem; color: #6b7280; font-weight: 600;">Active</div>
              </div>
              <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                <div style="width: 2.5rem; height: 2.5rem; padding: 0.5rem; border-radius: 10px; margin-bottom: 0.75rem; background: #f3e8ff; color: #9333ea;">
                  <SparklesIcon style="width: 100%; height: 100%;" />
                </div>
                <div style="font-size: 2rem; font-weight: 800; color: #1f2937; margin-bottom: 0.25rem;">{analytics.value.totalKarmaEarned || 0}</div>
                <div style="font-size: 0.8125rem; color: #6b7280; font-weight: 600;">Karma Earned</div>
              </div>
            </div>
            <div style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
              <h3 style="font-size: 1rem; font-weight: 700; color: #1f2937; margin-bottom: 1rem;">Performance Metrics</h3>
              <div style="margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                  <span style="color: #6b7280; font-weight: 600;">Success Rate</span>
                  <span style="color: #9333ea; font-weight: 700;">{analytics.value.successRate || 0}%</span>
                </div>
                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style={`height: 100%; background: linear-gradient(90deg, #9333ea 0%, #7e22ce 100%); width: ${analytics.value.successRate || 0}%;`}></div>
                </div>
              </div>
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                  <span style="color: #6b7280; font-weight: 600;">Consistency</span>
                  <span style="color: #9333ea; font-weight: 700;">{analytics.value.consistency || 0}%</span>
                </div>
                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style={`height: 100%; background: linear-gradient(90deg, #9333ea 0%, #7e22ce 100%); width: ${analytics.value.consistency || 0}%;`}></div>
                </div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
              <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                <div style="font-size: 2rem; font-weight: 800; color: #10b981; margin-bottom: 0.25rem;">{analytics.value.totalYes || 0}</div>
                <div style="font-size: 0.8125rem; color: #6b7280; font-weight: 600;">Days Completed</div>
              </div>
              <div style="background: white; border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
                <div style="font-size: 2rem; font-weight: 800; color: #ef4444; margin-bottom: 0.25rem;">{analytics.value.totalNo || 0}</div>
                <div style="font-size: 0.8125rem; color: #6b7280; font-weight: 600;">Days Missed</div>
              </div>
            </div>
          </div>
          )
        )}
      </div>
    );
  }
};
