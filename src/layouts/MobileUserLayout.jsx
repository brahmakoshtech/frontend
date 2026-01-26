import { RouterView } from 'vue-router';
import { useAuth } from '../store/auth.js';
import { useRouter } from 'vue-router';
import { computed } from 'vue';

export default {
  name: 'MobileUserLayout',
  setup() {
    const router = useRouter();
    const { user, token, logout } = useAuth();
    const activePage = computed(() => {
      const path = router.currentRoute.value.path;
      if (path.includes('/chat')) return 'chat';
      if (path.includes('/voice')) return 'voice';
      if (path.includes('/realtime-agent')) return 'realtime-agent';
      if (path.includes('/activities')) return 'activities';
      if (path.includes('/ask-bi')) return 'ask-bi';
      if (path.includes('/sadhana')) return 'sadhana';
      if (path.includes('/rewards')) return 'rewards';
      if (path.includes('/brahma-bazar')) return 'brahma-bazar';
      if (path.includes('/utility')) return 'utility';
      if (path.includes('/profile')) return 'profile';
      return 'home';
    });

    const setActivePage = (page) => {
      if (page === 'home') {
        router.push('/mobile/user/dashboard');
      } else if (page === 'chat') {
        router.push('/mobile/user/chat');
      } else if (page === 'voice') {
        router.push('/mobile/user/voice');
      } else if (page === 'realtime-agent') {
        router.push('/mobile/user/realtime-agent');
      } else if (page === 'activities') {
        router.push('/mobile/user/activities');
      } else if (page === 'ask-bi') {
        router.push('/mobile/user/ask-bi');
      } else if (page === 'sadhana') {
        router.push('/mobile/user/sadhana');
      } else if (page === 'rewards') {
        router.push('/mobile/user/rewards');
      } else if (page === 'brahma-bazar') {
        router.push('/mobile/user/brahma-bazar');
      } else if (page === 'utility') {
        router.push('/mobile/user/utility');
      } else if (page === 'profile') {
        router.push('/mobile/user/profile');
      }
    };

    const handleLogout = async () => {
      await logout('user');
      router.push('/user/login');
    };

    return () => (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside style={{
          width: '260px',
          height: '100vh',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 1000,
          overflow: 'hidden',
          boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #2d2d3e', minWidth: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'white', whiteSpace: 'nowrap' }}>Brahmakosh</h2>
                <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                  User Portal
                </p>
              </div>
            </div>
          </div>
          
          <nav 
            class="sidebar-nav"
            style={{ 
              flex: 1, 
              padding: '1rem 0', 
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style>{`
              .sidebar-nav::-webkit-scrollbar {
                display: none;
              }
              .sidebar-nav {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'activities', label: 'Spiritual Check-In', icon: '🧘' },
              { id: 'ask-bi', label: 'ASK BI (Live Avatar)', icon: '🤖' },
              { id: 'sadhana', label: 'Connect  (Services)', icon: '🕉️' },
              { id: 'rewards', label: 'Rewards', icon: '🏆' },
              { id: 'brahma-bazar', label: 'Brahma Bazar', icon: '🛒' },
              { id: 'utility', label: 'Utility', icon: '⚙️' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'chat', label: 'Chat', icon: '💬' },
              { id: 'voice', label: 'Voice', icon: '🎤' },
              { id: 'realtime-agent', label: 'Real Time Agent', icon: '🤖' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '1rem 1.5rem',
                  color: activePage.value === item.id ? '#6366f1' : '#b4b4c0',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  borderLeft: `3px solid ${activePage.value === item.id ? '#6366f1' : 'transparent'}`,
                  background: activePage.value === item.id ? '#2d2d3e' : 'transparent',
                  minWidth: 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                <span style={{ fontSize: '1.2rem', marginRight: '1rem', minWidth: '24px', textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div style={{ borderTop: '1px solid #2d2d3e', padding: '0.5rem 0', minWidth: 0, overflow: 'hidden' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                padding: '0.75rem 1.5rem',
                color: '#b4b4c0',
                textDecoration: 'none',
                transition: 'all 0.2s',
                borderLeft: '3px solid transparent',
                background: 'transparent',
                minWidth: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              <span style={{ fontSize: '1.2rem', marginRight: '1rem', minWidth: '24px', textAlign: 'center', flexShrink: 0 }}>🚪</span>
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div style={{ flex: 1, marginLeft: '260px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' }}>
          {/* Header */}
          <header style={{
            background: 'white',
            padding: '1rem 2rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b', fontWeight: 600 }}>User Portal</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 500 }}>Welcome, {user.value?.email || 'Spiritual Seeker'}!</p>
            </div>
          </header>
          
          <main style={{ padding: '2rem', flex: 1, minHeight: 'calc(100vh - 70px)' }}>
            <RouterView />
          </main>
        </div>
      </div>
    );
  }
};

