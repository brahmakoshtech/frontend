import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import spiritualActivityService from '../../../services/spiritualActivityService.js';
import { useToast } from 'vue-toastification';

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
    const expandedCards = ref(new Set());

    const handleActivity = (activity) => {
      console.log('Activity clicked:', activity);
      console.log('Category ID:', activity._id || activity.id);
      
      // Get type from API data or derive from title
      let activityType = (activity.type || activity.category || '').toLowerCase();
      
      // If no type, derive from title
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
      
      // Pass activity type and ID as query parameters to get related configurations
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

    const fetchData = async () => {
      try {
        loading.value = true;
        const response = await spiritualActivityService.getSpiritualCheckinData();
        
        if (response.success) {
          activities.value = response.data.activities || [];
          userStats.value = {
            totalStats: {
              sessions: response.data.stats?.sessions || 0,
              minutes: response.data.stats?.minutes || 0,
              karmaPoints: response.data.stats?.points || 0,
              streak: response.data.stats?.days || 0
            },
            categoryStats: response.data.categoryStats || {},
            recentActivities: response.data.recentActivities || []
          };
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
          .spiritual-activities {
            padding: 1rem;
            min-height: 100vh;
            background: #f8fafc;
          }
          
          .section-title {
            text-align: center;
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2rem;
          }
          
          .activities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .activity-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
          
          .activity-card:hover .hover-overlay {
            opacity: 1;
          }
          
          .activity-card:hover .arrow-btn {
            transform: scale(1.2);
            background-color: var(--activity-color) !important;
            color: white !important;
          }
          
          .motivation {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .motivation-emoji {
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
          }
          
          .motivation-title {
            font-size: 1.1rem;
            color: #1e293b;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }
          
          .motivation-text {
            color: #64748b;
            line-height: 1.5;
            font-size: 0.9rem;
          }
          
          .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .stat {
            text-align: center;
          }
          
          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          
          @media (max-width: 768px) {
            .spiritual-activities {
              padding: 0.75rem;
            }
            
            .activities-grid {
              grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
              gap: 1rem;
            }
            
            .motivation {
              padding: 1.25rem;
            }
            
            .motivation-title {
              font-size: 1rem;
            }
            
            .motivation-text {
              font-size: 0.85rem;
            }
            
            .stats {
              padding: 1.25rem;
            }
            
            .stat-value {
              font-size: 1.25rem;
            }
          }
          
          @media (max-width: 480px) {
            .spiritual-activities {
              padding: 0.5rem;
            }
            
            .section-title {
              font-size: 1.25rem;
              margin-bottom: 1.5rem;
            }
            
            .activities-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            
            .motivation {
              padding: 1rem;
              margin-bottom: 1rem;
            }
            
            .motivation-emoji {
              font-size: 1.25rem;
            }
            
            .motivation-title {
              font-size: 0.95rem;
            }
            
            .motivation-text {
              font-size: 0.8rem;
            }
            
            .stats {
              padding: 1rem;
              gap: 0.75rem;
            }
            
            .stat-value {
              font-size: 1.1rem;
            }
            
            .stat-label {
              font-size: 0.7rem;
            }
          }
        `}</style>
        
        <div>
          <h2 class="section-title">Spiritual Check-In</h2>
          
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
                {activities.value.map(activity => {
                  const isExpanded = expandedCards.value.has(activity._id);
                  const description = activity.description || activity.desc || '';
                  const shouldShowToggle = description && description.length > 80;
                  const displayDescription = shouldShowToggle && !isExpanded 
                    ? description.substring(0, 80) + '...' 
                    : description;
                  
                  const activityColor = {
                    meditation: '#8b5cf6',
                    prayer: '#10b981', 
                    chanting: '#f59e0b',
                    silence: '#6b7280',
                    breathing: '#06b6d4',
                    mindfulness: '#ec4899',
                    yoga: '#8b5cf6',
                    gratitude: '#10b981',
                    reflection: '#f59e0b'
                  }[activity.type] || '#8b5cf6';
                  
                  return (
                    <div 
                      key={activity._id}
                      class="activity-card card h-100 border-0 shadow-sm position-relative overflow-hidden"
                      style={{ 
                        '--activity-color': activityColor,
                        background: `linear-gradient(135deg, ${activityColor}08 0%, ${activityColor}15 30%, #f8fafc 100%)`,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleActivity(activity)}
                    >
                      <div class="card-body p-4">
                        {/* Icon/Image */}
                        <div class="mb-4">
                          <div 
                            class="activity-icon-container d-inline-flex align-items-center justify-content-center rounded-3"
                            style={{ 
                              width: '72px', 
                              height: '72px',
                              backgroundColor: `${activityColor}15`,
                              border: `2px solid ${activityColor}25`
                            }}
                          >
                            {activity.imageUrl || activity.image ? (
                              <img 
                                src={activity.imageUrl || activity.image} 
                                alt={activity.title}
                                class="activity-image rounded-3"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                class="activity-emoji d-flex align-items-center justify-content-center"
                                style={{ 
                                  fontSize: '2rem',
                                  color: activityColor,
                                  width: '100%',
                                  height: '100%'
                                }}
                              >
                                {activity.emoji || '🧘'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div class="mb-4">
                          <h5 class="card-title fw-bold mb-2 text-dark">{activity.title}</h5>
                          {(activity.description || activity.desc) && (
                            <div class="activity-description">
                              <p class="card-text text-muted mb-0 lh-base" style={{ fontSize: '0.95rem' }}>
                                {displayDescription}
                              </p>
                              {shouldShowToggle && (
                                <button 
                                  class="btn btn-link p-0 mt-1 text-decoration-none"
                                  style={{ fontSize: '0.85rem', color: activityColor }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(activity._id);
                                  }}
                                >
                                  {isExpanded ? 'See Less' : 'See More'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Meta Info */}
                        <div class="d-flex align-items-center justify-content-between">
                          <div class="d-flex align-items-center gap-2">
                            <span 
                              class="badge px-2 py-1"
                              style={{ 
                                backgroundColor: `${activityColor}15`,
                                color: activityColor,
                                fontSize: '0.75rem'
                              }}
                            >
                              {activity.type}
                            </span>
                            {activity.duration && (
                              <span class="text-muted" style={{ fontSize: '0.85rem' }}>
                                {activity.duration}
                              </span>
                            )}
                          </div>
                          <div 
                            class="arrow-btn d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: `${activityColor}10`,
                              color: activityColor,
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <span style={{ fontSize: '1.25rem' }}>→</span>
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Overlay */}
                      <div 
                        class="hover-overlay position-absolute top-0 start-0 w-100 h-100"
                        style={{
                          background: `linear-gradient(135deg, ${activityColor}15 0%, ${activityColor}25 100%)`,
                          pointerEvents: 'none',
                          borderRadius: '16px',
                          opacity: 0,
                          transition: 'opacity 0.3s ease'
                        }}
                      ></div>
                    </div>
                  );
                })}
              </div>
              
              <div class="motivation">
                <div class="motivation-emoji">🌸 ✨ 🕊️</div>
                <h3 class="motivation-title">Small steps, big transformation</h3>
                <p class="motivation-text">
                  Every moment of mindfulness counts. Start where you are, with what you have.
                </p>
              </div>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">{userStats.value?.totalStats?.streak || userStats.value?.streak || 0}</div>
                  <div class="stat-label">Days</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{userStats.value?.totalStats?.karmaPoints || userStats.value?.karmaPoints || 0}</div>
                  <div class="stat-label">Points</div>
                </div>
                <div class="stat">
                  <div class="stat-value">{userStats.value?.totalStats?.sessions || userStats.value?.sessions || 0}</div>
                  <div class="stat-label">Sessions</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
};