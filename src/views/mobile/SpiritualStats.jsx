import { ref, computed, onMounted } from 'vue';
import { 
  ChartBarIcon, 
  CalendarDaysIcon, 
  FireIcon, 
  TrophyIcon,
  HeartIcon,
  SparklesIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline';
import spiritualStatsService from '../../services/spiritualStatsService.js';
import { useToast } from 'vue-toastification';

export default {
  name: 'SpiritualStats',
  setup() {
    const toast = useToast();
    const loading = ref(false);
    const userStats = ref({
      totalStats: { sessions: 0, minutes: 0, karmaPoints: 0, streak: 0 },
      categoryStats: {},
      recentActivities: []
    });
    
    const stats = ref({
      totalCheckIns: 0,
      currentStreak: 0,
      longestStreak: 0,
      thisWeek: 0,
      thisMonth: 0,
      totalMeditation: 0,
      favoriteTime: 'Morning',
      mood: 'Peaceful'
    });

    const weeklyData = ref([]);

    const getMoodColor = (mood) => {
      const colors = {
        calm: '#10b981',
        peaceful: '#3b82f6',
        grateful: '#f59e0b',
        joyful: '#ef4444',
        serene: '#8b5cf6'
      };
      return colors[mood] || '#9ca3af';
    };

    const fetchUserStats = async () => {
      try {
        loading.value = true;
        const response = await spiritualStatsService.getUserStats();
        if (response.success) {
          userStats.value = response.data;
          
          // Calculate weekly data from real activities
          const weeklyActivities = calculateWeeklyData(response.data.recentActivities || []);
          weeklyData.value = weeklyActivities;
          
          // Calculate longest streak from activities
          const longestStreak = calculateLongestStreak(response.data.recentActivities || []);
          
          // Calculate this week's sessions
          const thisWeekSessions = calculateThisWeekSessions(response.data.recentActivities || []);
          
          // Update stats from real data
          stats.value = {
            totalCheckIns: response.data.totalStats?.sessions || 0,
            currentStreak: response.data.totalStats?.streak || 0,
            longestStreak: longestStreak,
            thisWeek: thisWeekSessions,
            thisMonth: response.data.monthlyStats?.sessions || 0,
            totalMeditation: response.data.totalStats?.minutes || 0,
            favoriteTime: response.data.insights?.favoriteTime || 'Morning',
            mood: response.data.insights?.commonMood || 'Peaceful'
          };
        }
      } catch (error) {
        console.error('Fetch stats error:', error);
        toast.error('Failed to load spiritual stats');
      } finally {
        loading.value = false;
      }
    };

    // Calculate weekly data from activities
    const calculateWeeklyData = (activities) => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      
      const weeklyData = days.map((day, index) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + index);
        
        const dayActivities = activities.filter(activity => {
          const activityDate = new Date(activity.createdAt);
          return activityDate.toDateString() === dayDate.toDateString();
        });
        
        const mostCommonMood = dayActivities.length > 0 ? 
          dayActivities[0].emotion || 'calm' : null;
        
        return {
          day,
          checkIns: dayActivities.length,
          mood: mostCommonMood
        };
      });
      
      return weeklyData;
    };

    // Calculate longest streak from activities
    const calculateLongestStreak = (activities) => {
      if (!activities || activities.length === 0) return 0;
      
      // Get unique dates from activities
      const uniqueDates = [...new Set(activities.map(activity => {
        const date = new Date(activity.createdAt);
        return date.toDateString();
      }))].sort((a, b) => new Date(b) - new Date(a));
      
      let longestStreak = 0;
      let currentStreak = 0;
      
      for (let i = 0; i < uniqueDates.length; i++) {
        if (i === 0) {
          currentStreak = 1;
        } else {
          const currentDate = new Date(uniqueDates[i]);
          const previousDate = new Date(uniqueDates[i - 1]);
          const daysDiff = Math.abs((previousDate - currentDate) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            currentStreak++;
          } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
          }
        }
      }
      
      return Math.max(longestStreak, currentStreak);
    };

    // Calculate this week's sessions
    const calculateThisWeekSessions = (activities) => {
      if (!activities || activities.length === 0) return 0;
      
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      endOfWeek.setHours(23, 59, 59, 999);
      
      return activities.filter(activity => {
        const activityDate = new Date(activity.createdAt);
        return activityDate >= startOfWeek && activityDate <= endOfWeek;
      }).length;
    };

    const formatUserName = (userDetails) => {
      if (userDetails?.name && !userDetails.name.startsWith('User-')) {
        return userDetails.name;
      }
      
      if (userDetails?.email) {
        const username = userDetails.email.split('@')[0];
        const cleanName = username
          .replace(/[0-9]/g, '')
          .replace(/[._-]/g, ' ')
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .split(' ')
          .filter(word => word.length > 0)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        return cleanName || username;
      }
      
      return userDetails?.name || 'Unknown User';
    };

    const formatDuration = (minutes) => {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const getActivityIcon = (type) => {
      const icons = {
        meditation: '🧘',
        prayer: '🙏',
        chanting: '🎵',
        breathing: '💨',
        mindfulness: '🌸',
        yoga: '🧘♀️',
        gratitude: '🙏',
        silence: '🤫',
        reflection: '🤔'
      };
      return icons[type] || '🧘';
    };

    const getStatusColor = (status) => {
      const colors = {
        completed: '#10b981',
        partial: '#f59e0b',
        skipped: '#ef4444'
      };
      return colors[status] || '#6b7280';
    };

    onMounted(() => {
      fetchUserStats();
    });

    return () => (
      <div class="spiritual-stats">
        <style>{`
          .spiritual-stats {
            padding: 1rem;
            min-height: 100vh;
            background: #f8fafc;
          }
          
          .stats-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            position: relative;
            z-index: 1;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 1.5rem 2rem;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .header-content {
            flex: 1;
          }
          
          .header-content .stats-title {
            font-size: 2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .header-content .stats-subtitle {
            color: #64748b;
            font-size: 1.1rem;
            font-weight: 500;
          }
          
          .refresh-btn {
            background: #3b82f6;
            border: none;
            border-radius: 8px;
            padding: 0.5rem 1rem;
            color: white;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
          }
          
          .refresh-btn:hover {
            background: #2563eb;
          }
          
          .refresh-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
          }
          
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .stat-icon {
            width: 2.5rem;
            height: 2.5rem;
            margin: 0 auto 1rem;
            padding: 0.5rem;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }
          
          .stat-label {
            font-size: 0.8rem;
            color: #64748b;
            font-weight: 500;
          }
          
          .weekly-chart {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .chart-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          
          .chart-bars {
            display: flex;
            justify-content: space-between;
            align-items: end;
            height: 120px;
            margin-bottom: 1rem;
          }
          
          .chart-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
          }
          
          .bar {
            width: 20px;
            border-radius: 4px 4px 0 0;
            margin-bottom: 0.5rem;
            transition: all 0.3s ease;
          }
          
          .bar.active {
            height: 60px;
          }
          
          .bar.inactive {
            height: 20px;
            background: #e2e8f0 !important;
          }
          
          .day-label {
            font-size: 0.7rem;
            color: #64748b;
            font-weight: 500;
          }
          
          .insights {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .insights-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .insight-item {
            padding: 0.75rem;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            border-left: 4px solid #3b82f6;
          }
          
          .insight-text {
            font-size: 0.9rem;
            color: #475569;
            line-height: 1.4;
          }
          
          @media (max-width: 768px) {
            .spiritual-stats {
              padding: 0.75rem;
            }
            
            .stats-header {
              flex-direction: column;
              gap: 1rem;
              padding: 1.25rem 1.5rem;
              text-align: center;
            }
            
            .header-content .stats-title {
              font-size: 1.75rem;
            }
            
            .header-content .stats-subtitle {
              font-size: 1rem;
            }
            
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
            
            .stat-card {
              padding: 1rem;
            }
            
            .stat-value {
              font-size: 1.25rem;
            }
            
            .table-header {
              grid-template-columns: 2fr 1fr 1fr;
            }
            
            .table-row {
              grid-template-columns: 2fr 1fr 1fr;
            }
            
            .header-cell:nth-child(n+4),
            .table-cell:nth-child(n+4) {
              display: none;
            }
            
            .activity-name {
              font-size: 0.8rem;
            }
          }
            
            .activity-list {
              max-height: 400px;
              overflow-y: auto;
            }
            
            .data-table {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e2e8f0;
            }
            
            .table-header {
              display: grid;
              grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 1fr 1fr;
              background: #f8fafc;
              border-bottom: 1px solid #e2e8f0;
              font-weight: 600;
              font-size: 0.8rem;
              color: #374151;
            }
            
            .header-cell {
              padding: 0.75rem 0.5rem;
              text-align: left;
            }
            
            .table-row {
              display: grid;
              grid-template-columns: 1.5fr 2fr 1fr 1fr 1fr 1fr 1fr;
              border-bottom: 1px solid #f1f5f9;
              transition: background-color 0.2s ease;
            }
            
            .table-row:hover {
              background: #f8fafc;
            }
            
            .table-cell {
              padding: 0.75rem 0.5rem;
              display: flex;
              align-items: center;
              font-size: 0.8rem;
            }
            
            .user-cell {
              display: flex;
              flex-direction: column;
            }
            
            .user-name {
              font-weight: 600;
              color: #1e293b;
              font-size: 0.85rem;
            }
            
            .user-email {
              font-size: 0.7rem;
              color: #6b7280;
            }
            
            .activity-cell {
              display: flex;
              align-items: center;
              gap: 0.5rem;
            }
            
            .activity-emoji {
              font-size: 1.2rem;
            }
            
            .activity-name {
              font-weight: 500;
              color: #1e293b;
              margin-bottom: 0.125rem;
            }
            
            .activity-emotion-small {
              font-size: 0.7rem;
              color: #6b7280;
            }
            
            .type-badge {
              background: #e2e8f0;
              padding: 0.25rem 0.5rem;
              border-radius: 12px;
              font-size: 0.7rem;
              text-transform: capitalize;
              color: #374151;
            }
            
            .status-cell {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 0.25rem;
            }
            
            .status-dot {
              width: 8px;
              height: 8px;
              border-radius: 50%;
            }
            
            .status-text {
              text-transform: capitalize;
              font-size: 0.75rem;
            }
            
            .completion-percentage {
              font-size: 0.7rem;
              color: #6b7280;
            }
            
            .date-cell {
              display: flex;
              flex-direction: column;
              color: #6b7280;
              font-size: 0.75rem;
            }
            
            .time-cell {
              font-size: 0.7rem;
              color: #9ca3af;
            }
            
            .chanting-name {
              font-size: 0.7rem;
              color: #f59e0b;
              font-style: italic;
            }
            
            .chant-count {
              color: #f59e0b;
              font-weight: 600;
              font-size: 0.75rem;
            }
            
            .points-cell {
              color: #f59e0b;
              font-weight: 600;
              font-size: 0.75rem;
            }
            
            .activity-item {
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 1rem;
              margin-bottom: 0.75rem;
              transition: all 0.2s ease;
            }
            
            .activity-item:hover {
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .activity-header {
              display: flex;
              align-items: flex-start;
              gap: 0.75rem;
            }
            
            .activity-icon {
              font-size: 1.5rem;
              width: 40px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              border-radius: 50%;
              flex-shrink: 0;
            }
            
            .activity-info {
              flex: 1;
              min-width: 0;
            }
            
            .activity-title {
              font-size: 0.9rem;
              font-weight: 600;
              color: #1e293b;
              margin: 0 0 0.25rem 0;
            }
            
            .activity-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 0.5rem;
              font-size: 0.75rem;
              color: #64748b;
            }
            
            .activity-type {
              background: #e2e8f0;
              padding: 0.125rem 0.5rem;
              border-radius: 12px;
              text-transform: capitalize;
            }
            
            .activity-duration {
              background: #dbeafe;
              color: #1e40af;
              padding: 0.125rem 0.5rem;
              border-radius: 12px;
            }
            
            .activity-date {
              color: #9ca3af;
            }
            
            .activity-status {
              text-align: right;
              flex-shrink: 0;
            }
            
            .status-badge {
              color: white;
              padding: 0.25rem 0.5rem;
              border-radius: 12px;
              font-size: 0.7rem;
              font-weight: 500;
              text-transform: capitalize;
              margin-bottom: 0.25rem;
            }
            
            .karma-points {
              font-size: 0.75rem;
              color: #f59e0b;
              font-weight: 600;
            }
            
            .activity-emotion {
              margin-top: 0.5rem;
              font-size: 0.8rem;
              color: #6b7280;
            }
            
            .completion-bar {
              margin-top: 0.5rem;
              height: 4px;
              background: #e2e8f0;
              border-radius: 2px;
              overflow: hidden;
            }
            
            .completion-progress {
              height: 100%;
              background: #10b981;
              transition: width 0.3s ease;
            }
            
            .empty-state {
              text-align: center;
              padding: 2rem;
              color: #64748b;
            }
            
            .empty-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            
            .empty-state h6 {
              color: #374151;
              margin-bottom: 0.5rem;
            }
          }
        `}</style>

        {/* Header */}
        <div class="stats-header">
          <div class="header-content">
            <h1 class="stats-title">Spiritual Journey Stats</h1>
            <p class="stats-subtitle">Track your spiritual growth and mindfulness practice</p>
          </div>
          <button 
            class={`refresh-btn ${loading.value ? 'loading' : ''}`}
            onClick={fetchUserStats}
            disabled={loading.value}
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" style={{ backgroundColor: '#3b82f615' }}>
              <ChartBarIcon style={{ width: '1.5rem', height: '1.5rem', color: '#3b82f6' }} />
            </div>
            <div class="stat-value">{stats.value.totalCheckIns}</div>
            <div class="stat-label">Total Check-ins</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style={{ backgroundColor: '#ef444415' }}>
              <FireIcon style={{ width: '1.5rem', height: '1.5rem', color: '#ef4444' }} />
            </div>
            <div class="stat-value">{stats.value.currentStreak}</div>
            <div class="stat-label">Current Streak</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style={{ backgroundColor: '#f59e0b15' }}>
              <TrophyIcon style={{ width: '1.5rem', height: '1.5rem', color: '#f59e0b' }} />
            </div>
            <div class="stat-value">{stats.value.longestStreak}</div>
            <div class="stat-label">Longest Streak</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style={{ backgroundColor: '#10b98115' }}>
              <CalendarDaysIcon style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
            </div>
            <div class="stat-value">{stats.value.thisWeek}</div>
            <div class="stat-label">This Week</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" style={{ backgroundColor: '#8b5cf615' }}>
              <SparklesIcon style={{ width: '1.5rem', height: '1.5rem', color: '#8b5cf6' }} />
            </div>
            <div class="stat-value">{userStats.value.totalStats?.karmaPoints || 0}</div>
            <div class="stat-label">Total Karma</div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div class="weekly-chart">
          <h3 class="chart-title">Weekly Check-in Pattern</h3>
          <div class="chart-bars">
            {weeklyData.value.map(day => (
              <div key={day.day} class="chart-bar">
                <div 
                  class={`bar ${day.checkIns > 0 ? 'active' : 'inactive'}`}
                  style={{ 
                    backgroundColor: day.mood ? getMoodColor(day.mood) : '#e2e8f0'
                  }}
                />
                <span class="day-label">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User History Section */}
        <div class="insights">
          <h3 class="insights-title">
            <ClockIcon style={{ width: '1.25rem', height: '1.25rem', color: '#3b82f6' }} />
            My Spiritual Activities
          </h3>
          
          {loading.value ? (
            <div class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : userStats.value.recentActivities?.length > 0 ? (
            <div class="data-table">
              <div class="table-header">
                <div class="header-cell">User</div>
                <div class="header-cell">Activity</div>
                <div class="header-cell">Type</div>
                <div class="header-cell">Duration</div>
                <div class="header-cell">Status</div>
                <div class="header-cell">Date</div>
                <div class="header-cell">Points</div>
              </div>
              {userStats.value.recentActivities.map((activity, index) => (
                <div key={activity.id || index} class="table-row">
                  <div class="table-cell">
                    <div class="user-cell">
                      <div class="user-name">{formatUserName(activity.userDetails)}</div>
                      <div class="user-email">{activity.userDetails?.email || 'Unknown'}</div>
                    </div>
                  </div>
                  <div class="table-cell">
                    <div class="activity-cell">
                      <span class="activity-emoji">{getActivityIcon(activity.type)}</span>
                      <div>
                        <div class="activity-name">{activity.title}</div>
                        {activity.emotion && (
                          <div class="activity-emotion-small">Feeling: {activity.emotion}</div>
                        )}
                        {activity.type === 'chanting' && activity.chantingName && (
                          <div class="chanting-name">{activity.chantingName}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="table-cell">
                    <span class="type-badge">{activity.type}</span>
                  </div>
                  <div class="table-cell">
                    {activity.type === 'chanting' ? (
                      <span class="chant-count">{activity.chantCount || 0} chants</span>
                    ) : (
                      <span>{activity.actualDuration ? formatDuration(activity.actualDuration) : '-'}</span>
                    )}
                  </div>
                  <div class="table-cell">
                    <div class="status-cell">
                      <div 
                        class="status-dot"
                        style={{ backgroundColor: getStatusColor(activity.status) }}
                      ></div>
                      <span class="status-text">{activity.status}</span>
                      <div class="completion-percentage">{activity.completionPercentage || 100}%</div>
                    </div>
                  </div>
                  <div class="table-cell">
                    <div class="date-cell">
                      {new Date(activity.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                      <div class="time-cell">
                        {new Date(activity.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div class="table-cell">
                    {activity.karmaPoints ? (
                      <div class="points-cell">+{activity.karmaPoints} ✨</div>
                    ) : '-'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div class="empty-state">
              <div class="empty-icon">📊</div>
              <h6>No Activities Yet</h6>
              <p>Start your spiritual journey to see your progress here!</p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div class="insights">
          <h3 class="insights-title">
            <SparklesIcon style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
            Spiritual Insights
          </h3>
          
          <div class="insight-item">
            <p class="insight-text">
              🌅 You're most active in the <strong>{stats.value.favoriteTime}</strong> - keep up this beautiful routine!
            </p>
          </div>
          
          <div class="insight-item">
            <p class="insight-text">
              🔥 Your current streak of <strong>{stats.value.currentStreak} days</strong> shows great dedication to your spiritual practice.
            </p>
          </div>
          
          <div class="insight-item">
            <p class="insight-text">
              🧘 You've spent <strong>{stats.value.totalMeditation} minutes</strong> in mindful reflection this month.
            </p>
          </div>
          
          <div class="insight-item">
            <p class="insight-text">
              💫 Your most common mood is <strong>{stats.value.mood}</strong> - a sign of inner harmony.
            </p>
          </div>
        </div>
      </div>
    );
  }
};