import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  CalendarIcon,
  ChartBarIcon,
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon,
  StarIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/vue/24/outline';

export default {
  name: 'ClientActivity',
  setup() {
    const router = useRouter();
    const loading = ref(false);

    const spiritualActivities = [
      {
        id: 1,
        name: 'Meditation',
        icon: ClockIcon,
        description: 'Guided meditation sessions with breathing techniques and mindfulness practices',
        color: '#8b5cf6',
        participants: 12847,
        duration: '15-30 min',
        route: '/client/activity/meditation',
        category: 'Mindfulness',
        difficulty: 'Beginner',
        rating: 4.8,
        sessions: 156,
        trending: true
      },
      {
        id: 2,
        name: 'Chanting',
        icon: SparklesIcon,
        description: 'Sacred mantras, Om chanting, and Vedic hymns for spiritual awakening',
        color: '#f59e0b',
        participants: 8924,
        duration: '10-20 min',
        route: '/client/activity/chanting',
        category: 'Devotion',
        difficulty: 'Intermediate',
        rating: 4.7,
        sessions: 89,
        trending: false
      },
      {
        id: 3,
        name: 'Prayer & Worship',
        icon: HeartIcon,
        description: 'Daily prayers, devotional practices, and spiritual connection rituals',
        color: '#ef4444',
        participants: 15632,
        duration: '5-15 min',
        route: '/client/activity/prathana',
        category: 'Prayer',
        difficulty: 'Beginner',
        rating: 4.9,
        sessions: 203,
        trending: true
      },
      {
        id: 11,
        name: 'Silence',
        icon: EyeIcon,
        description: 'Deep silence meditation, inner stillness, and peaceful contemplation practices',
        color: '#6b7280',
        participants: 4521,
        duration: '20-45 min',
        route: '/client/activity/silence',
        category: 'Stillness',
        difficulty: 'Advanced',
        rating: 4.9,
        sessions: 78,
        trending: false
      },
      {
        id: 4,
        name: 'Pranayama',
        icon: UserIcon,
        description: 'Advanced breathing techniques including Anulom Vilom and Kapalbhati',
        color: '#06b6d4',
        participants: 7431,
        duration: '10-25 min',
        route: '/client/activity/prayanam',
        category: 'Breathing',
        difficulty: 'Advanced',
        rating: 4.6,
        sessions: 67,
        trending: false
      },
      {
        id: 5,
        name: 'Spiritual Wisdom',
        icon: ChartBarIcon,
        description: 'Ancient scriptures, Bhagavad Gita teachings, and philosophical discussions',
        color: '#10b981',
        participants: 6342,
        duration: '20-45 min',
        route: '/client/activity/wisdom',
        category: 'Learning',
        difficulty: 'Intermediate',
        rating: 4.5,
        sessions: 124,
        trending: false
      },
      {
        id: 6,
        name: 'Devotional Music',
        icon: SparklesIcon,
        description: 'Bhajans, kirtans, and spiritual songs for heart-centered practice',
        color: '#ec4899',
        participants: 9876,
        duration: '15-30 min',
        route: '/client/activity/soul-music',
        category: 'Music',
        difficulty: 'Beginner',
        rating: 4.8,
        sessions: 145,
        trending: true
      },
      {
        id: 7,
        name: 'Yoga Asanas',
        icon: UserIcon,
        description: 'Traditional yoga poses, Surya Namaskara, and flexibility training',
        color: '#14b8a6',
        participants: 18234,
        duration: '30-60 min',
        route: '/client/activity/yoga',
        category: 'Physical',
        difficulty: 'Intermediate',
        rating: 4.7,
        sessions: 278,
        trending: true
      },
      {
        id: 8,
        name: 'Mindful Living',
        icon: EyeIcon,
        description: 'Present moment awareness, conscious living, and daily mindfulness',
        color: '#3b82f6',
        participants: 8567,
        duration: '10-20 min',
        route: '/client/activity/mindfulness',
        category: 'Awareness',
        difficulty: 'Beginner',
        rating: 4.6,
        sessions: 98,
        trending: false
      },
      {
        id: 9,
        name: 'Gratitude Practice',
        icon: HeartIcon,
        description: 'Daily gratitude journaling, appreciation exercises, and positive thinking',
        color: '#f97316',
        participants: 7218,
        duration: '5-10 min',
        route: '/client/activity/gratitude',
        category: 'Positivity',
        difficulty: 'Beginner',
        rating: 4.9,
        sessions: 156,
        trending: false
      },
      {
        id: 10,
        name: 'Self Reflection',
        icon: ClockIcon,
        description: 'Inner contemplation, self-inquiry, and personal growth exercises',
        color: '#6366f1',
        participants: 5987,
        duration: '15-30 min',
        route: '/client/activity/self-reflection',
        category: 'Growth',
        difficulty: 'Intermediate',
        rating: 4.4,
        sessions: 87,
        trending: false
      },

    ];

    const stats = ref({
      totalParticipants: 101058,
      activeToday: 2847,
      totalSessions: 1403,
      completionRate: '87%'
    });

    const goBack = () => {
      router.push('/client/tools');
    };

    const handleActivityClick = (route) => {
      router.push(route);
    };

    const getCategoryBadgeColor = (category) => {
      const colors = {
        'Mindfulness': 'bg-primary',
        'Devotion': 'bg-warning',
        'Prayer': 'bg-danger',
        'Breathing': 'bg-info',
        'Learning': 'bg-success',
        'Music': 'bg-secondary',
        'Physical': 'bg-success',
        'Awareness': 'bg-primary',
        'Positivity': 'bg-warning',
        'Growth': 'bg-info',
        'Stillness': 'bg-dark'
      };
      return colors[category] || 'bg-secondary';
    };

    const getDifficultyColor = (difficulty) => {
      const colors = {
        'Beginner': 'text-success',
        'Intermediate': 'text-warning',
        'Advanced': 'text-danger'
      };
      return colors[difficulty] || 'text-muted';
    };

    return () => (
      <div class="container-fluid px-4">
        <style>{`
          .activity-card {
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 16px;
          }
          .activity-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
          .activity-icon {
            transition: all 0.3s ease;
          }
          .activity-card:hover .activity-icon {
            transform: rotate(10deg) scale(1.1);
          }
          .arrow-btn {
            transition: all 0.3s ease;
          }
          .activity-card:hover .arrow-btn {
            transform: scale(1.2);
            background-color: var(--activity-color) !important;
            color: white !important;
          }
          .hover-overlay {
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .activity-card:hover .hover-overlay {
            opacity: 1;
          }
          .trending-badge {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          .stats-card {
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .stats-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.2) !important;
          }
          .stats-icon {
            transition: all 0.3s ease;
          }
          .stats-card:hover .stats-icon {
            transform: scale(1.2) rotate(5deg);
          }
        `}</style>
        <div class="row">
          <div class="col-12">
            {/* Header Section */}
            <div class="mb-5">
              <div class="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between mb-3 gap-3">
                <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-3 w-100">
                  <button
                    class="btn btn-outline-secondary btn-sm rounded-pill px-3"
                    onClick={goBack}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                    <span class="d-none d-sm-inline">Back to Tools</span>
                    <span class="d-sm-none">Back</span>
                  </button>
                  <div class="flex-grow-1">
                    <h1 class="display-6 display-lg-5 fw-bold text-dark mb-2">
                      <SparklesIcon style={{ width: '2rem', height: '2rem' }} class="me-2 text-primary d-none d-sm-inline" />
                      <span class="d-block d-sm-inline">Spiritual Activities Hub</span>
                    </h1>
                    <p class="lead fs-6 fs-md-5 text-muted mb-0">Transform your life through authentic spiritual practices and ancient wisdom</p>
                  </div>
                </div>
                <div class="text-start text-lg-end">
                  <div class="badge bg-light text-dark px-3 py-2 fs-6 shadow">
                    {spiritualActivities.length} Sacred Practices
                  </div>
                </div>
              </div>
              <hr class="border-2 opacity-25" />
            </div>

            {/* Enhanced Stats Cards */}
            <div class="row g-4 mb-5">
              <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="stats-card card border-0 shadow-sm rounded-4 h-100" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}>
                  <div class="card-body p-4">
                    <div class="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 class="fw-bold mb-1 text-light">0</h3>
                        <p class="mb-0 text-light opacity-75">Active Practitioners</p>
                      </div>
                      <div class="bg-light bg-opacity-20 rounded-3 p-3">
                        <UserIcon class="stats-icon" style={{ width: '1.5rem', height: '1.5rem', color: '#1e293b' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="stats-card card border-0 shadow-sm rounded-4 h-100" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
                  <div class="card-body p-4">
                    <div class="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 class="fw-bold mb-1 text-light">0</h3>
                        <p class="mb-0 text-light opacity-75">Daily Participants</p>
                      </div>
                      <div class="bg-light bg-opacity-20 rounded-3 p-3">
                        <FireIcon class="stats-icon" style={{ width: '1.5rem', height: '1.5rem', color: '#1e293b' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="stats-card card border-0 shadow-sm rounded-4 h-100" style={{ background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)' }}>
                  <div class="card-body p-4">
                    <div class="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 class="fw-bold mb-1 text-light">0</h3>
                        <p class="mb-0 text-light opacity-75">Total Sessions</p>
                      </div>
                      <div class="bg-light bg-opacity-20 rounded-3 p-3">
                        <TrophyIcon class="stats-icon" style={{ width: '1.5rem', height: '1.5rem', color: '#1e293b' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-xl-3 col-lg-6 col-md-6">
                <div class="stats-card card border-0 shadow-sm rounded-4 h-100" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
                  <div class="card-body p-4">
                    <div class="d-flex align-items-center justify-content-between">
                      <div>
                        <h3 class="fw-bold mb-1 text-light">0%</h3>
                        <p class="mb-0 text-light opacity-75">Success Rate</p>
                      </div>
                      <div class="bg-light bg-opacity-20 rounded-3 p-3">
                        <StarIcon class="stats-icon" style={{ width: '1.5rem', height: '1.5rem', color: '#1e293b' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Activities Grid */}
            <div class="row g-4">
              {spiritualActivities.map(activity => (
                <div key={activity.id} class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
                  <div
                    class="activity-card card h-100 border-0 shadow-sm position-relative overflow-hidden"
                    style={{
                      '--activity-color': activity.color,
                      background: `linear-gradient(135deg, ${activity.color}08 0%, ${activity.color}15 30%, #f8fafc 100%)`
                    }}
                    onClick={() => handleActivityClick(activity.route)}
                  >
                    {/* Trending Badge */}
                    {activity.trending && (
                      <div class="position-absolute top-0 start-0 m-3">
                        <span class="trending-badge badge bg-danger text-white px-2 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                          🔥 Trending
                        </span>
                      </div>
                    )}

                    {/* Category Badge */}
                    <div class="position-absolute top-0 end-0 m-3">
                      <span class={`badge ${getCategoryBadgeColor(activity.category)} px-2 py-1`}>
                        {activity.category}
                      </span>
                    </div>

                    <div class="card-body p-4">
                      {/* Icon */}
                      <div class="mb-4">
                        <div
                          class="activity-icon d-inline-flex align-items-center justify-content-center rounded-3"
                          style={{
                            width: '72px',
                            height: '72px',
                            backgroundColor: `${activity.color}15`,
                            border: `2px solid ${activity.color}25`
                          }}
                        >
                          <activity.icon
                            style={{
                              width: '2rem',
                              height: '2rem',
                              color: activity.color
                            }}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div class="mb-4">
                        <h5 class="card-title fw-bold mb-2 text-dark">{activity.name}</h5>
                        <p class="card-text text-muted mb-3 lh-base" style={{ fontSize: '0.9rem' }}>
                          {activity.description}
                        </p>

                        {/* Difficulty Level */}
                        <div class="mb-2">
                          <span class={`badge bg-light ${getDifficultyColor(activity.difficulty)} px-2 py-1`} style={{ fontSize: '0.7rem' }}>
                            {activity.difficulty} Level
                          </span>
                        </div>
                      </div>

                      {/* Action Section */}
                      <div class="d-flex align-items-center justify-content-between pt-3 border-top border-light">
                        <div class="d-flex flex-column">
                          <small class="text-muted">Duration</small>
                          <span class="fw-semibold text-dark" style={{ fontSize: '0.85rem' }}>{activity.duration}</span>
                        </div>
                        <div
                          class="arrow-btn d-flex align-items-center justify-content-center rounded-circle"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: `${activity.color}10`,
                            color: activity.color
                          }}
                        >
                          <ArrowRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect Overlay */}
                    <div
                      class="hover-overlay position-absolute top-0 start-0 w-100 h-100"
                      style={{
                        background: `linear-gradient(135deg, ${activity.color}15 0%, ${activity.color}25 100%)`,
                        pointerEvents: 'none',
                        borderRadius: '16px'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Footer */}
            <div class="mt-5 pt-4 border-top">
              <div class="row align-items-center">
                <div class="col-md-8">
                  <p class="text-muted mb-2">
                    <strong>🕉️ Begin Your Spiritual Journey:</strong> Each practice is designed by experienced spiritual teachers and backed by ancient wisdom.
                  </p>
                  <small class="text-muted">Join thousands of practitioners worldwide in authentic spiritual transformation.</small>
                </div>
                <div class="col-md-4 text-md-end">
                  <div class="d-flex flex-column align-items-md-end">
                    <div class="badge bg-light text-dark px-3 py-2 mb-2">
                      🌟 4.7 Average Rating
                    </div>
                    <small class="text-muted">Updated: {new Date().toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};