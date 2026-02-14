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
  ArrowPathIcon,
  PlayIcon,
  MusicalNoteIcon
} from '@heroicons/vue/24/outline';
import spiritualStatsService from '../../services/spiritualStatsService.js';
import { useToast } from 'vue-toastification';


export default {
  name: 'SpiritualStats',
  setup() {
    const toast = useToast();
    const loading = ref(false);
    const page = ref(1);
    const limit = ref(25);
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
          console.log('Raw API response:', response.data);
          console.log('Recent activities:', response.data.recentActivities);
          console.log('Recent activities length:', response.data.recentActivities?.length);
          console.log('Activity types:', response.data.recentActivities?.map(a => a.type));
          
          userStats.value = {
            totalStats: response.data.totalStats || {
              sessions: response.data.totalStats?.sessions || 0,
              minutes: response.data.totalStats?.minutes || 0,
              karmaPoints: response.data.totalStats?.karmaPoints || 0,
              streak: response.data.totalStats?.streak || 0
            },
            categoryStats: response.data.categoryStats || {},
            recentActivities: response.data.recentActivities || []
          };
          
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
            thisMonth: response.data.totalStats?.sessions || 0,
            totalMeditation: response.data.totalStats?.minutes || 0,
            favoriteTime: 'Morning',
            mood: 'Peaceful'
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
        reflection: '🤔',
        video: '🎥',
        audio: '🎧'
      };
      return icons[type] || '🧘';
    };

    const showVideoModal = ref(false);
    const showAudioModal = ref(false);
    const selectedMedia = ref(null);
    const chartCanvas = ref(null);

    const paginatedActivities = computed(() => {
      const start = (page.value - 1) * limit.value;
      const end = start + limit.value;
      return userStats.value.recentActivities.slice(start, end);
    });

    const totalPages = computed(() => {
      return Math.max(Math.ceil(userStats.value.recentActivities.length / limit.value), 1);
    });

    const goToPage = (newPage) => {
      const target = Math.min(Math.max(newPage, 1), totalPages.value);
      if (target === page.value) return;
      page.value = target;
    };

    const drawChart = () => {
      if (!chartCanvas.value) return;
      
      const canvas = chartCanvas.value;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Chart settings
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;
      const barWidth = chartWidth / 7;
      const maxValue = 10;
      
      // Draw grid lines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = padding + (i * chartHeight / 5);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }
      
      // Draw Y-axis labels
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const value = maxValue - (i * 2);
        const y = padding + (i * chartHeight / 5) + 4;
        ctx.fillText(value.toString(), padding - 10, y);
      }
      
      // Draw bars
      weeklyData.value.forEach((day, index) => {
        const x = padding + (index * barWidth) + barWidth * 0.2;
        const barHeight = (day.checkIns / maxValue) * chartHeight;
        const y = height - padding - barHeight;
        
        // Bar
        ctx.fillStyle = day.mood ? getMoodColor(day.mood) : '#e2e8f0';
        ctx.fillRect(x, y, barWidth * 0.6, barHeight);
        
        // Bar border
        ctx.strokeStyle = day.checkIns > 0 ? '#2563eb' : '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth * 0.6, barHeight);
        
        // Value label
        if (day.checkIns > 0) {
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 11px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(day.checkIns.toString(), x + barWidth * 0.3, y - 5);
        }
        
        // Day label
        ctx.fillStyle = '#64748b';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(day.day, x + barWidth * 0.3, height - 10);
      });
      
      // Draw trend line
      if (weeklyData.value.length > 1) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        
        weeklyData.value.forEach((day, index) => {
          const x = padding + (index * barWidth) + barWidth * 0.5;
          const y = height - padding - ((day.checkIns / maxValue) * chartHeight);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    const openVideoModal = (activity) => {
      if (activity.videoUrl) {
        selectedMedia.value = activity;
        showVideoModal.value = true;
      }
    };

    const openAudioModal = (activity) => {
      if (activity.audioUrl) {
        selectedMedia.value = activity;
        showAudioModal.value = true;
      }
    };

    const closeVideoModal = () => {
      showVideoModal.value = false;
      selectedMedia.value = null;
    };

    const closeAudioModal = () => {
      showAudioModal.value = false;
      selectedMedia.value = null;
    };

    onMounted(() => {
      fetchUserStats();
      setTimeout(() => {
        drawChart();
      }, 100);
    });

    return () => (
      <>
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
          
          .activities-table {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .table-header {
            display: grid;
            grid-template-columns: 1.2fr 1.5fr 1fr 1.4fr 1.4fr 1.2fr 1fr 1.2fr 0.8fr 0.8fr 1.2fr 1fr;
            background: #f8fafc;
            padding: 1rem;
            font-weight: 600;
            font-size: 0.875rem;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            gap: 0.75rem;
          }
          
          .table-row {
            display: grid;
            grid-template-columns: 1.2fr 1.5fr 1fr 1.4fr 1.4fr 1.2fr 1fr 1.2fr 0.8fr 0.8fr 1.2fr 1fr;
            padding: 1rem;
            border-bottom: 1px solid #f3f4f6;
            align-items: center;
            gap: 0.75rem;
          }
          
          .table-row:hover {
            background: #f9fafb;
          }
          
          .table-cell {
            font-size: 0.875rem;
          }
          
          .activity-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .activity-icon {
            font-size: 1.25rem;
          }
          
          .activity-title {
            font-weight: 600;
            color: #111827;
          }
          
          .activity-emotion {
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 0.25rem;
          }
          
          .type-tag {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: capitalize;
            background: #dbeafe;
            color: #1e40af;
          }
          
          .status-tag {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: capitalize;
          }
          
          .status-completed {
            background: #dcfce7;
            color: #166534;
          }
          
          .status-partial {
            background: #fef3c7;
            color: #92400e;
          }
          
          .status-skipped {
            background: #fee2e2;
            color: #991b1b;
          }
          
          .progress-bar {
            width: 100%;
            height: 4px;
            background: #e5e7eb;
            border-radius: 2px;
            margin-top: 0.5rem;
            overflow: hidden;
          }
          
          .progress-fill {
            height: 100%;
            background: #3b82f6;
            transition: width 0.3s ease;
          }
          
          .karma-points {
            color: #f59e0b;
            font-weight: 600;
          }
          
          .date-cell {
            font-size: 0.8rem;
          }
          
          .date-main {
            color: #374151;
          }
          
          .date-time {
            color: #6b7280;
            font-size: 0.75rem;
            margin-top: 0.25rem;
          }
          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 60vw;
            max-height: 60vh;
            overflow: hidden;
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .modal-body {
            padding: 1rem;
          }
          
          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
          }
          
          .media-icon {
            font-size: 1.2rem;
            transition: transform 0.2s;
          }
          
          .media-icon:hover {
            transform: scale(1.2);
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

        {/* Karma Breakdown */}
        {userStats.value.totalStats?.karmaPointsBreakdown && (
          <div class="weekly-chart" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
            <h3 class="chart-title" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Karma Breakdown</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
              <div style={{ textAlign: 'center', padding: '0.4rem', background: '#f0fdf4', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#10b981' }}>+{userStats.value.totalStats.karmaPointsBreakdown.fromActivities}</div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Activities</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.4rem', background: '#fffbeb', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f59e0b' }}>+{userStats.value.totalStats.karmaPointsBreakdown.bonus}</div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Bonus</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.4rem', background: '#fef2f2', borderRadius: '4px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ef4444' }}>-{userStats.value.totalStats.karmaPointsBreakdown.spent}</div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Spent</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.4rem', background: '#fef3c7', borderRadius: '4px', border: '1px solid #f59e0b' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#92400e' }}>={userStats.value.totalStats.karmaPointsBreakdown.total}</div>
                <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Total</div>
              </div>
            </div>
          </div>
        )}

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
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div>Loading...</div>
            </div>
          ) : userStats.value.recentActivities?.length > 0 ? (
            <div class="activities-table">
              <div class="table-header">
                <div class="table-cell">User</div>
                <div class="table-cell">Activity</div>
                <div class="table-cell">Type</div>
                <div class="table-cell">Target Duration</div>
                <div class="table-cell">Actual Duration</div>
                <div class="table-cell">Completion</div>
                <div class="table-cell">Emotion</div>
                <div class="table-cell">Karma Points</div>
                <div class="table-cell">Video</div>
                <div class="table-cell">Audio</div>
                <div class="table-cell">Date</div>
                <div class="table-cell">Status</div>
              </div>
              {paginatedActivities.value.map((activity, index) => (
                <div key={index} class="table-row">
                  <div class="table-cell">
                    <div class="user-name">{formatUserName(activity.userDetails)}</div>
                  </div>
                  <div class="table-cell activity-cell">
                    <span class="activity-icon">{getActivityIcon(activity.type)}</span>
                    <div class="activity-info">
                      <div class="activity-title">{activity.title}</div>
                    </div>
                  </div>
                  <div class="table-cell">
                    <span class={`type-tag type-${activity.type}`}>{activity.type}</span>
                  </div>
                  <div class="table-cell">
                    {activity.type === 'chanting' ? '-' : `${activity.targetDuration || 0} min`}
                  </div>
                  <div class="table-cell">
                    {activity.type === 'chanting' ? `${activity.chantCount || 0} chants` : `${activity.actualDuration || 0} min`}
                  </div>
                  <div class="table-cell">
                    {activity.completionPercentage ? `${activity.completionPercentage}%` : '100%'}
                  </div>
                  <div class="table-cell">
                    {activity.emotion || '-'}
                  </div>
                  <div class="table-cell">
                    {activity.karmaPoints ? `+${activity.karmaPoints} ✨` : '-'}
                  </div>
                  <div class="table-cell">
                    {activity.videoUrl ? (
                      <span 
                        class="media-icon clickable" 
                        onClick={() => openVideoModal(activity)}
                        style={{ cursor: 'pointer' }}
                      >
                        🎥
                      </span>
                    ) : '-'}
                  </div>
                  <div class="table-cell">
                    {activity.audioUrl ? (
                      <span 
                        class="media-icon clickable" 
                        onClick={() => openAudioModal(activity)}
                        style={{ cursor: 'pointer' }}
                      >
                        🎧
                      </span>
                    ) : '-'}
                  </div>
                  <div class="table-cell date-cell">
                    <div class="date-main">{new Date(activity.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}</div>
                    <div class="date-time">{new Date(activity.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                  </div>
                  <div class="table-cell">
                    <span class={`status-tag status-${activity.status}`}>{activity.status}</span>
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

          {/* Pagination */}
          {userStats.value.recentActivities.length > limit.value && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginTop: '1rem',
              padding: '1rem',
              background: 'white',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Page {page.value} of {totalPages.value} ({userStats.value.recentActivities.length} activities)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: page.value <= 1 ? '#f1f5f9' : 'white',
                    color: page.value <= 1 ? '#94a3b8' : '#1e293b',
                    cursor: page.value <= 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  disabled={page.value <= 1}
                  onClick={() => goToPage(page.value - 1)}
                >
                  Previous
                </button>
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: page.value >= totalPages.value ? '#f1f5f9' : 'white',
                    color: page.value >= totalPages.value ? '#94a3b8' : '#1e293b',
                    cursor: page.value >= totalPages.value ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                  disabled={page.value >= totalPages.value}
                  onClick={() => goToPage(page.value + 1)}
                >
                  Next
                </button>
              </div>
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

        {/* Video Modal */}
        {showVideoModal.value && selectedMedia.value && (
          <div class="modal-overlay" onClick={closeVideoModal}>
            <div class="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
              <div class="modal-header">
                <h3>{selectedMedia.value.title} - Video</h3>
                <button class="close-btn" onClick={closeVideoModal}>×</button>
              </div>
              <div class="modal-body">
                <video 
                  controls 
                  autoplay 
                  style={{ width: '100%', maxHeight: '250px' }}
                  src={selectedMedia.value.videoUrl}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}

        {/* Audio Modal */}
        {showAudioModal.value && selectedMedia.value && (
          <div class="modal-overlay" onClick={closeAudioModal}>
            <div class="modal-content audio-modal" onClick={(e) => e.stopPropagation()}>
              <div class="modal-header">
                <h3>{selectedMedia.value.title} - Audio</h3>
                <button class="close-btn" onClick={closeAudioModal}>×</button>
              </div>
              <div class="modal-body">
                <audio 
                  controls 
                  autoplay 
                  style={{ width: '100%' }}
                  src={selectedMedia.value.audioUrl}
                >
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
};