import { computed } from 'vue';
import { useAuth } from '../../store/auth.js';
import { useRouter } from 'vue-router';
import { 
  ChatBubbleLeftRightIcon, 
  MicrophoneIcon, 
  UserIcon, 
  FilmIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline';

export default {
  name: 'MobileUserDashboard',
  setup() {
    const router = useRouter();
    const { user } = useAuth();

    const tools = [
      {
        id: 1,
        name: 'Text Chat',
        icon: ChatBubbleLeftRightIcon,
        description: 'Start a conversation with AI using text messages',
        route: '/mobile/user/chat',
        color: '#10b981'
      },
      {
        id: 2,
        name: 'Voice Chat',
        icon: MicrophoneIcon,
        description: 'Have a voice-to-voice conversation with AI',
        route: '/mobile/user/voice',
        color: '#8b5cf6'
      },
      {
        id: 3,
        name: 'My Profile',
        icon: UserIcon,
        description: 'View and manage your profile information',
        route: '/mobile/user/profile',
        color: '#3b82f6'
      },
      {
        id: 4,
        name: 'BrahmAvatar Reels',
        icon: FilmIcon,
        description: 'Watch spiritual reels and divine content',
        route: '/mobile/user/brahm-avatar',
        color: '#ff9500'
      }
    ];

    const handleCardClick = (route) => {
      router.push(route);
    };

    return () => (
      <div class="container-fluid px-4">
        <style>{`
          .tool-card {
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 16px;
          }
          .tool-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
          .tool-icon {
            transition: all 0.3s ease;
          }
          .tool-card:hover .tool-icon {
            transform: rotate(10deg) scale(1.1);
          }
          .arrow-btn {
            transition: all 0.3s ease;
          }
          .tool-card:hover .arrow-btn {
            transform: scale(1.2);
            background-color: var(--tool-color) !important;
            color: white !important;
          }
          .hover-overlay {
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .tool-card:hover .hover-overlay {
            opacity: 1;
          }
        `}</style>
        
        {/* Header Section */}
        <div class="mb-5">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h3 class="fw-bold text-dark mb-2">Welcome, {user.value?.email || 'User'}!</h3>
              <p class="lead text-muted mb-0">Access your AI-powered tools and features</p>
            </div>
            <div class="text-end">
              <button
                onClick={() => handleCardClick('/mobile/user/profile')}
                class="btn btn-primary px-4 py-2"
                style={{
                  borderRadius: '12px',
                  fontWeight: '500'
                }}
              >
                View Profile
              </button>
            </div>
          </div>
          <hr class="border-2 opacity-25" />
        </div>

        {/* Tools Grid */}
        <div class="row g-4">
          {tools.map(tool => (
            <div key={tool.id} class="col-xl-4 col-lg-4 col-md-6 col-sm-12">
              <div 
                class="tool-card card h-100 border-0 shadow-sm position-relative overflow-hidden" 
                style={{ 
                  '--tool-color': tool.color,
                  background: `linear-gradient(135deg, ${tool.color}08 0%, ${tool.color}15 30%, #f8fafc 100%)`
                }}
                onClick={() => handleCardClick(tool.route)}
              >
                <div class="card-body p-4">
                  {/* Icon */}
                  <div class="mb-4">
                    <div 
                      class="tool-icon d-inline-flex align-items-center justify-content-center rounded-3"
                      style={{ 
                        width: '72px', 
                        height: '72px',
                        backgroundColor: `${tool.color}15`,
                        border: `2px solid ${tool.color}25`
                      }}
                    >
                      <tool.icon 
                        style={{ 
                          width: '2rem', 
                          height: '2rem',
                          color: tool.color
                        }} 
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div class="mb-4">
                    <h5 class="card-title fw-bold mb-2 text-dark">{tool.name}</h5>
                    <p class="card-text text-muted mb-0 lh-base" style={{ fontSize: '0.95rem' }}>
                      {tool.description}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center text-muted" style={{ fontSize: '0.85rem' }}>
                      <span>Tap to access</span>
                    </div>
                    <div 
                      class="arrow-btn d-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: `${tool.color}10`,
                        color: tool.color
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
                    background: `linear-gradient(135deg, ${tool.color}15 0%, ${tool.color}25 100%)`,
                    pointerEvents: 'none',
                    borderRadius: '16px'
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
};

