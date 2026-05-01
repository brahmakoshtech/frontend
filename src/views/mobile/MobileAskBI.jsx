import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'MobileAskBI',
  setup() {
    const router = useRouter();
    const liveAvatars = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const activeTab = ref('guides');
    const chatHistory = ref([]);
    const historyLoading = ref(false);

    const startChat = (avatar) => {
      router.push({
        path: '/mobile/user/askbi/chat',
        query: {
          avatarId: avatar._id,
          name: avatar.name,
          image: avatar.imageUrl || ''
        }
      });
    };

    const fetchLiveAvatars = async () => {
      try {
        loading.value = true;
        error.value = null;
        const response = await api.get('/live-avatars/public');
        liveAvatars.value = response.data?.data || [];
      } catch (err) {
        error.value = 'Unable to load avatars. Please try again.';
        liveAvatars.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchChatHistory = async () => {
      try {
        historyLoading.value = true;
        const token = localStorage.getItem('token_user');
        const res = await api.getChats(token);
        let chats = [];
        if (res.data?.success && res.data?.data?.chats) chats = res.data.data.chats;
        else if (res.data?.chats) chats = res.data.chats;

        chatHistory.value = chats
          .filter(c => c.title?.startsWith('Chat with') || c.avatarName)
          .map(c => ({
            _id: c.chatId || c._id,
            avatarName: c.avatarName || c.title?.replace(/^Chat with /i, '') || 'Avatar',
            updatedAt: c.updatedAt,
            messageCount: c.messageCount || 0
          }))
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      } catch (e) {
        chatHistory.value = [];
      } finally {
        historyLoading.value = false;
      }
    };

    const switchTab = (tab) => {
      activeTab.value = tab;
      if (tab === 'history' && chatHistory.value.length === 0) fetchChatHistory();
    };

    const openChat = (chat) => {
      router.push({
        path: '/mobile/user/askbi/chat',
        query: { chatId: chat._id, name: chat.avatarName }
      });
    };

    const fmtDate = (iso) => {
      if (!iso) return '';
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    };

    onMounted(fetchLiveAvatars);

    return () => (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f1eb 0%, #ede7d9 100%)', padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>Ask BI</h1>
          <p style={{ color: '#8b4513', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>Your AI spiritual guides</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            onClick={() => switchTab('guides')}
            style={{
              flex: 1, padding: '0.65rem', border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem',
              background: activeTab.value === 'guides' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'white',
              color: activeTab.value === 'guides' ? 'white' : '#6b5b73',
              boxShadow: activeTab.value === 'guides' ? '0 4px 12px rgba(99,102,241,0.3)' : '0 2px 6px rgba(0,0,0,0.08)'
            }}
          >
            🙏 Guides
          </button>
          <button
            onClick={() => switchTab('history')}
            style={{
              flex: 1, padding: '0.65rem', border: 'none', borderRadius: '12px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem',
              background: activeTab.value === 'history' ? 'linear-gradient(135deg, #f5a623, #e8821a)' : 'white',
              color: activeTab.value === 'history' ? 'white' : '#6b5b73',
              boxShadow: activeTab.value === 'history' ? '0 4px 12px rgba(245,166,35,0.3)' : '0 2px 6px rgba(0,0,0,0.08)'
            }}
          >
            💬 Chat History
          </button>
        </div>

        {/* ── GUIDES TAB ── */}
        {activeTab.value === 'guides' && (
          loading.value ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div class="spinner-border text-primary" role="status" />
              <p style={{ marginTop: '1rem', color: '#6b5b73' }}>Loading guides...</p>
            </div>
          ) : error.value ? (
            <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '1rem', color: '#dc2626' }}>
              {error.value}
            </div>
          ) : liveAvatars.value.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b5b73' }}>
              <p style={{ fontSize: '3rem' }}>🙏</p>
              <p>No spiritual guides available right now.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {liveAvatars.value.map(avatar => (
                <div key={avatar._id} style={{
                  background: 'white', borderRadius: '16px', padding: '1.25rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1px solid rgba(139,69,19,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    {avatar.imageUrl ? (
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #f5a623' }}
                      />
                    ) : (
                      <div style={{
                        width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, #f5a623, #e8821a)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem'
                      }}>🙏</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#2d3748' }}>{avatar.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#8b4513' }}>
                        {avatar.category} • {avatar.gender}
                      </p>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#6b5b73', lineHeight: '1.5' }}>
                    {(avatar.description?.length || 0) > 100
                      ? avatar.description.substring(0, 100) + '...'
                      : avatar.description || 'AI spiritual guide'}
                  </p>
                  <button
                    onClick={() => startChat(avatar)}
                    style={{
                      width: '100%', padding: '0.7rem',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem'
                    }}
                  >
                    💬 Start Chat
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── CHAT HISTORY TAB ── */}
        {activeTab.value === 'history' && (
          historyLoading.value ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div class="spinner-border text-warning" role="status" />
              <p style={{ marginTop: '1rem', color: '#6b5b73' }}>Loading history...</p>
            </div>
          ) : chatHistory.value.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b5b73' }}>
              <p style={{ fontSize: '3rem' }}>💬</p>
              <p>No chat history yet. Start a conversation!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {chatHistory.value.map(chat => (
                <div
                  key={chat._id}
                  onClick={() => openChat(chat)}
                  style={{
                    background: 'white', borderRadius: '14px', padding: '1rem 1.25rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid rgba(139,69,19,0.08)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem'
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #f5a623, #e8821a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
                  }}>🙏</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#2d3748', marginBottom: '0.2rem' }}>
                      {chat.avatarName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {fmtDate(chat.updatedAt)} • {chat.messageCount} messages
                    </div>
                  </div>
                  <div style={{ color: '#f5a623', fontSize: '1.4rem' }}>›</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  }
};
