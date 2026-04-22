import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../../services/api.js';

export default {
  name: 'MobileAskBI',
  setup() {
    const router = useRouter();
    const agents = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const voiceIconMap = {
      krishna1: '🕉️', krishna2: '🕉️', krishna3: '🕉️',
      rashmi1: '🌸', rashmi2: '🌸', rashmi3: '🌸',
      saavi1: '🧘', god1: '✨', kanika1: '🎵', kanika2: '🎵',
      ranbir1: '🌟', priyanka1: '💫', roohi1: '🌺', raqib1: '🔮'
    };

    const startChat = (agent) => {
      router.push({
        path: '/mobile/user/askbi/chat',
        query: {
          agentId: agent._id,
          name: agent.name,
          voiceName: agent.voiceName
        }
      });
    };

    const startVoice = (agent) => {
      router.push({
        path: '/mobile/user/voice',
        query: {
          agentId: agent._id,
          name: agent.name,
          voiceName: agent.voiceName
        }
      });
    };

    const fetchAgents = async () => {
      try {
        loading.value = true;
        error.value = null;
        const token = localStorage.getItem('token_user');
        const response = await api.get('/mobile/agents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        agents.value = response.data?.data || [];
      } catch (err) {
        error.value = 'Unable to load agents. Please try again.';
        agents.value = [];
      } finally {
        loading.value = false;
      }
    };

    onMounted(fetchAgents);

    return () => (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f1eb 0%, #ede7d9 100%)', padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2d3748', margin: 0 }}>Ask BI</h1>
          <p style={{ color: '#8b4513', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>Your AI spiritual guides</p>
        </div>

        {loading.value ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div class="spinner-border text-primary" role="status" />
            <p style={{ marginTop: '1rem', color: '#6b5b73' }}>Loading guides...</p>
          </div>
        ) : error.value ? (
          <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '1rem', color: '#dc2626' }}>
            {error.value}
          </div>
        ) : agents.value.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b5b73' }}>
            <p style={{ fontSize: '3rem' }}>🙏</p>
            <p>No spiritual guides available right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {agents.value.map(agent => (
              <div key={agent._id} style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.25rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid rgba(139,69,19,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f5a623, #e8821a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0
                  }}>
                    {voiceIconMap[agent.voiceName] || '🤖'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#2d3748' }}>{agent.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#8b4513' }}>🎙 {agent.voiceName}</p>
                  </div>
                </div>
                <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#6b5b73', lineHeight: '1.5' }}>
                  {agent.description || 'AI spiritual guide'}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => startChat(agent)}
                    style={{
                      flex: 1, padding: '0.65rem',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem'
                    }}
                  >
                    💬 Chat
                  </button>
                  <button
                    onClick={() => startVoice(agent)}
                    style={{
                      flex: 1, padding: '0.65rem',
                      background: 'linear-gradient(135deg, #f5a623, #e8821a)',
                      color: 'white', border: 'none', borderRadius: '10px',
                      cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem'
                    }}
                  >
                    🎙 Voice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};