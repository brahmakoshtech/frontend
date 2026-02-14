import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import spiritualActivityService from '../../../services/spiritualActivityService.js';
import { useToast } from 'vue-toastification';
import { 
  HomeIcon, 
  CheckCircleIcon, 
  CpuChipIcon, 
  UserGroupIcon, 
  HeartIcon 
} from '@heroicons/vue/24/outline';

export default {
  name: 'SpiritualActivities',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const loading = ref(false);
    const activities = ref([]);
    const userStats = ref({
      totalStats: { sessions: 0, minutes: 0, karmaPoints: 0, streak: 0 },
      categoryStats: {},
      recentActivities: []
    });
    const motivation = ref({
      emoji: '🌸 ✨ 🕊️',
      title: 'Small steps, big transformation',
      text: 'Every moment of mindfulness counts. Start where you are, with what you have.'
    });
    const expandedCards = ref(new Set());

    const handleActivity = (activity) => {
      console.log('Activity clicked:', activity);
      console.log('Category ID:', activity._id || activity.id);
      
      let activityType = (activity.type || activity.category || '').toLowerCase();
      
      if (!activityType && activity.title) {
        const title = activity.title.toLowerCase();
        if (title.includes('meditat')) activityType = 'meditation';
        else if (title.includes('pray')) activityType = 'prayer';
        else if (title.includes('chant')) activityType = 'chanting';
        else if (title.includes('silence')) activityType = 'silence';
      }
      
      console.log('Final activity type:', activityType);
      
      const categoryRoutes = {
        meditation: '/mobile/user/meditate',
        prayer: '/mobile/user/pray', 
        chanting: '/mobile/user/chant',
        chant: '/mobile/user/chant',
        silence: '/mobile/user/silence',
        breathing: '/mobile/user/breathing',
        mindfulness: '/mobile/user/mindfulness',
        yoga: '/mobile/user/yoga',
        gratitude: '/mobile/user/gratitude',
        reflection: '/mobile/user/reflection'
      };
      
      const route = categoryRoutes[activityType] || '/mobile/user/meditate';
      console.log('Routing to:', route);
      
      router.push({
        path: route,
        query: { 
          type: activityType,
          categoryId: activity._id || activity.id
        }
      });
    };

    const toggleExpanded = (activityId) => {
      if (expandedCards.value.has(activityId)) {
        expandedCards.value.delete(activityId);
      } else {
        expandedCards.value.add(activityId);
      }
    };

    const handleNavigation = (route) => {
      router.push(route);
    };

    const fetchData = async () => {
      try {
        loading.value = true;
        const response = await spiritualActivityService.getSpiritualCheckinData();
        
        if (response.success) {
          activities.value = response.data.activities || [];
          userStats.value = {
            totalStats: response.data.totalStats || {
              sessions: response.data.stats?.sessions || 0,
              minutes: response.data.stats?.minutes || 0,
              karmaPoints: response.data.stats?.points || 0,
              streak: response.data.stats?.days || 0
            },
            categoryStats: response.data.categoryStats || {},
            recentActivities: response.data.recentActivities || [],
            stats: response.data.stats || {}
          };
          motivation.value = response.data.motivation || motivation.value;
          console.log('Data loaded:', { activities: activities.value.length, stats: userStats.value });
        } else {
          toast.error('Failed to load spiritual activities');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error loading data');
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchData();
    });

    return () => (
      <div class="spiritual-activities">
        <style>{`
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body, html {
            overflow-x: hidden;
            width: 100%;
          }
          
          .spiritual-activities {
            min-height: 100vh;
            width: 100%;
            max-width: 100vw;
            background: linear-gradient(135deg, #EEE0C4 0%, #E6D7B8 50%, #DDD0AC 100%);
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow-x: hidden;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: linear-gradient(135deg, #EEE0C4 0%, #E6D7B8 50%, #DDD0AC 100%);
            color: #2d3748;
            border-radius: 20px;
            margin: 1rem;
            width: calc(100% - 2rem);
            box-shadow: 0 8px 25px rgba(238, 224, 196, 0.3);
            border: 1px solid rgba(255,255,255,0.4);
          }
          
          .header-left {
            text-align: left;
          }
          
          .header-right {
            text-align: right;
          }
          
          .brand-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #2d3748;
            margin: 0;
            letter-spacing: 1px;
            text-shadow: 0 1px 2px rgba(255,255,255,0.5);
          }
          
          .hashtag {
            font-size: 0.8rem;
            color: #4a5568;
            margin: 0 0 0.25rem 0;
            font-weight: 600;
          }
          
          .subtitle {
            font-size: 0.85rem;
            color: #718096;
            font-weight: 400;
            margin: 0;
            font-style: italic;
          }
          
          .content {
            padding: 1rem;
            width: 100%;
            max-width: 100%;
          }
          
          .activities-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
            width: 100%;
          }
          
          .activity-card {
            background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
            border-radius: 16px;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            cursor: pointer;
            transition: all 0.3s ease;
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 100%;
          }
          
          .activity-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          }
          
          .activity-image {
            width: 70px;
            height: 70px;
            object-fit: cover;
            border-radius: 14px;
            margin-bottom: 0.5rem;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          }
          
          .activity-icon {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
          }
          
          .activity-title {
            font-size: 0.85rem;
            font-weight: 700;
            color: #4a4a4a;
            margin: 0;
            line-height: 1.2;
          }
          
          .motivation {
            background: rgba(255,255,255,0.8);
            border-radius: 16px;
            padding: 1rem;
            text-align: center;
            margin-bottom: 1rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            width: 100%;
          }
          
          .motivation-emoji {
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
          }
          
          .motivation-title {
            font-size: 0.9rem;
            color: #8b4513;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }
          
          .motivation-text {
            color: #6b5b73;
            line-height: 1.4;
            font-size: 0.75rem;
          }
          
          .karma-text {
            text-align: center;
            font-size: 0.8rem;
            color: #8b7355;
            margin-bottom: 1rem;
            font-weight: 500;
          }
          
          .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            background: rgba(255,255,255,0.8);
            border-radius: 16px;
            padding: 1rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            margin-bottom: 1rem;
            width: 100%;
          }
          
          .stat {
            text-align: center;
          }
          
          .stat-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: #8b4513;
            margin-bottom: 0.25rem;
          }
          
          .stat-label {
            font-size: 0.65rem;
            color: #a0522d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          
          .bottom-nav {
            position: fixed;
            bottom: 20px;
            left: 10px;
            right: 10px;
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            padding: 0.5rem 0;
            z-index: 1000;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          }
          
          .nav-tabs {
            display: flex;
            justify-content: space-around;
            align-items: center;
            max-width: 500px;
            margin: 0 auto;
            padding: 0 1rem;
          }
          
          .nav-tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5rem 0.25rem;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 12px;
            min-width: 50px;
          }
          
          .nav-tab.active {
            background: rgba(139, 69, 19, 0.1);
            transform: translateY(-2px);
          }
          
          .nav-icon {
            width: 1.5rem;
            height: 1.5rem;
            margin-bottom: 0.25rem;
            transition: all 0.3s ease;
            stroke-width: 2;
          }
          
          .nav-tab.active .nav-icon {
            color: #8b4513;
            transform: scale(1.1);
          }
          
          .nav-label {
            font-size: 0.65rem;
            font-weight: 600;
            color: #666;
            text-align: center;
            line-height: 1;
          }
          
          .nav-tab.active .nav-label {
            color: #8b4513;
          }
          
          .main-content {
            padding-bottom: 80px;
          }
          
          /* Mobile styles */
          @media (max-width: 768px) {
            .bottom-nav {
              display: block;
            }
            .header {
              flex-direction: column;
              text-align: center;
              padding: 1rem;
              border-radius: 16px;
              margin: 0.75rem;
              width: calc(100% - 1.5rem);
            }
            
            .header-left, .header-right {
              text-align: center;
            }
            
            .brand-title {
              font-size: 1.4rem;
              margin-bottom: 0.5rem;
            }
            
            .hashtag {
              font-size: 0.75rem;
              margin-bottom: 0.25rem;
            }
            
            .subtitle {
              font-size: 0.8rem;
            }
          }
          
          /* Desktop styles */
          @media (min-width: 769px) {
            .bottom-nav {
              display: none;
            }
            
            .main-content {
              padding-bottom: 0;
            }
            .header {
              padding: 1.5rem 2rem;
              border-radius: 24px;
              margin: 1.5rem;
              width: calc(100% - 3rem);
            }
            
            .brand-title {
              font-size: 1.8rem;
            }
            
            .hashtag {
              font-size: 0.9rem;
            }
            
            .subtitle {
              font-size: 1rem;
            }
            
            .content {
              padding: 2rem;
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .activities-grid {
              grid-template-columns: repeat(4, 1fr);
              gap: 2rem;
              max-width: 1000px;
              margin: 0 auto 2rem;
            }
            
            .activity-card {
              padding: 2.5rem;
              border-radius: 24px;
              min-height: 220px;
              max-width: 220px;
            }
            
            .activity-image {
              width: 130px;
              height: 130px;
              border-radius: 24px;
              margin-bottom: 1rem;
            }
            
            .activity-icon {
              font-size: 5rem;
              margin-bottom: 1rem;
            }
            
            .activity-title {
              font-size: 1.2rem;
              font-weight: 700;
            }
            
            .motivation {
              padding: 1.5rem;
              border-radius: 20px;
              margin-bottom: 1.5rem;
            }
            
            .motivation-emoji {
              font-size: 1.5rem;
              margin-bottom: 0.75rem;
            }
            
            .motivation-title {
              font-size: 1.1rem;
            }
            
            .motivation-text {
              font-size: 0.9rem;
              line-height: 1.5;
            }
            
            .karma-text {
              font-size: 0.95rem;
              margin-bottom: 2rem;
            }
            
            .stats {
              padding: 1.5rem;
              gap: 1rem;
              border-radius: 20px;
              margin-bottom: 2rem;
            }
            
            .stat-value {
              font-size: 1.5rem;
            }
            
            .stat-label {
              font-size: 0.75rem;
            }
          }
        `}</style>
        
        <div class="main-content">
        <div class="header">
          <div class="header-left">
            <h1 class="brand-title">BRAHMAKOSH</h1>
          </div>
          <div class="header-right">
            <p class="hashtag">#AreYouSpiritual</p>
            <p class="subtitle">Take a moment for yourself</p>
          </div>
        </div>
        
        <div class="content">
          {loading.value ? (
            <div class="text-center py-5">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="text-muted">Loading activities...</p>
            </div>
          ) : (
            <>
              <div class="activities-grid">
                {activities.value.map(activity => (
                  <div key={activity.id || activity._id} class="activity-card" onClick={() => handleActivity(activity)}>
                    {activity.image ? (
                      <img 
                        src={activity.image} 
                        alt={activity.title}
                        class="activity-image"
                      />
                    ) : (
                      <div class="activity-icon">{activity.icon || '🧘'}</div>
                    )}
                    <h3 class="activity-title">{activity.title}</h3>
                  </div>
                ))}
              </div>
              
              <div class="motivation">
                <div class="motivation-emoji">{motivation.value.emoji}</div>
                <h3 class="motivation-title">{motivation.value.title}</h3>
                <p class="motivation-text">{motivation.value.text}</p>
              </div>
              
              <p class="karma-text">Earn Karma points with each check-in</p>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">{userStats.value?.totalStats?.streak || userStats.value?.stats?.days || 0}</div>
                  <div class="stat-label">Days</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{userStats.value?.totalStats?.karmaPoints || userStats.value?.stats?.points || 0}</div>
                  <div class="stat-label">Total</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{userStats.value?.totalStats?.sessions || userStats.value?.stats?.sessions || 0}</div>
                  <div class="stat-label">Sessions</div>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
        
        <div class="bottom-nav">
          <div class="nav-tabs">
            <div class="nav-tab active" onClick={() => handleNavigation('/mobile/user/home')}>
              <HomeIcon class="nav-icon" />
              <div class="nav-label">Home</div>
            </div>
            <div class="nav-tab" onClick={() => handleNavigation('/mobile/user/checkin')}>
              <CheckCircleIcon class="nav-icon" />
              <div class="nav-label">CheckIn</div>
            </div>
            <div class="nav-tab" onClick={() => handleNavigation('/mobile/user/ask-bi-nav')}>
              <CpuChipIcon class="nav-icon" />
              <div class="nav-label">Ask BI</div>
            </div>
            <div class="nav-tab" onClick={() => handleNavigation('/mobile/user/connect')}>
              <UserGroupIcon class="nav-icon" />
              <div class="nav-label">Connect</div>
            </div>
            <div class="nav-tab" onClick={() => handleNavigation('/mobile/user/remedies')}>
              <HeartIcon class="nav-icon" />
              <div class="nav-label">Remedies</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};