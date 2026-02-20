import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, TrophyIcon, SparklesIcon, FireIcon } from '@heroicons/vue/24/outline';
import leaderboardService from '../../services/leaderboardService';

export default {
  name: 'MobileLeaderboard',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const activeTab = ref('sankalpas');
    const sankalpLeaderboard = ref([]);
    const karmaLeaderboard = ref([]);

    const goBack = () => router.back();

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
      } finally {
        loading.value = false;
      }
    };

    const getMedalIcon = (rank) => {
      if (rank === 1) return '🥇';
      if (rank === 2) return '🥈';
      if (rank === 3) return '🥉';
      return `#${rank}`;
    };

    onMounted(() => {
      fetchLeaderboards();
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
          .tabs {
            display: flex;
            gap: 0.5rem;
          }
          .tab {
            flex: 1;
            padding: 0.75rem;
            border: none;
            background: #f3f4f6;
            color: #6b7280;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          .tab.active {
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            color: white;
          }
          .tab-icon {
            width: 1.125rem;
            height: 1.125rem;
          }
          .content {
            padding: 1rem;
          }
          .leaderboard-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .leaderboard-item {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .rank-badge {
            font-size: 1.5rem;
            font-weight: 800;
            min-width: 3rem;
            text-align: center;
          }
          .user-info {
            flex: 1;
          }
          .user-name {
            font-size: 1rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.25rem;
          }
          .user-stats {
            font-size: 0.8125rem;
            color: #6b7280;
          }
          .score {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .score-value {
            font-size: 1.25rem;
            font-weight: 800;
            color: #9333ea;
          }
          .score-label {
            font-size: 0.6875rem;
            color: #6b7280;
            font-weight: 600;
          }
          .loading-spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid #f3e8ff;
            border-top-color: #9333ea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          .empty-state {
            text-align: center;
            padding: 4rem 1.5rem;
          }
          .empty-icon {
            width: 4rem;
            height: 4rem;
            color: #d1d5db;
            margin: 0 auto 1rem;
          }
          .empty-text {
            color: #9ca3af;
            font-size: 0.875rem;
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
            <h1 class="page-title">Leaderboard</h1>
          </div>
          
          <div class="tabs">
            <button 
              class={`tab ${activeTab.value === 'sankalpas' ? 'active' : ''}`}
              onClick={() => activeTab.value = 'sankalpas'}
            >
              <TrophyIcon class="tab-icon" />
              Sankalpas
            </button>
            <button 
              class={`tab ${activeTab.value === 'karma' ? 'active' : ''}`}
              onClick={() => activeTab.value = 'karma'}
            >
              <SparklesIcon class="tab-icon" />
              Karma Points
            </button>
          </div>
        </div>

        {loading.value ? (
          <div style="display: flex; justify-content: center; align-items: center; padding: 5rem;">
            <div class="loading-spinner"></div>
          </div>
        ) : (
          <div class="content">
            {activeTab.value === 'sankalpas' ? (
              sankalpLeaderboard.value.length > 0 ? (
                <div class="leaderboard-list">
                  {sankalpLeaderboard.value.map(entry => (
                    <div key={entry.user._id} class="leaderboard-item">
                      <div class="rank-badge">{getMedalIcon(entry.rank)}</div>
                      <div class="user-info">
                        <div class="user-name">{entry.user.name}</div>
                        <div class="user-stats">
                          <FireIcon style="width: 0.875rem; height: 0.875rem; display: inline; color: #f59e0b;" />
                          {entry.totalKarmaFromSankalpas} karma earned
                        </div>
                      </div>
                      <div class="score">
                        <div class="score-value">{entry.completedSankalpas}</div>
                        <div class="score-label">Completed</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="empty-state">
                  <TrophyIcon class="empty-icon" />
                  <p class="empty-text">No data available yet</p>
                </div>
              )
            ) : (
              karmaLeaderboard.value.length > 0 ? (
                <div class="leaderboard-list">
                  {karmaLeaderboard.value.map(entry => (
                    <div key={entry.user._id} class="leaderboard-item">
                      <div class="rank-badge">{getMedalIcon(entry.rank)}</div>
                      <div class="user-info">
                        <div class="user-name">{entry.user.name}</div>
                      </div>
                      <div class="score">
                        <div class="score-value">{entry.user.karmaPoints}</div>
                        <div class="score-label">Karma Points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="empty-state">
                  <SparklesIcon class="empty-icon" />
                  <p class="empty-text">No data available yet</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  }
};
