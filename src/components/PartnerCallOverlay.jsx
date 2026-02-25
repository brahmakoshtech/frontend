import { computed, onMounted } from 'vue';
import {
  ensurePartnerVoiceConnected,
  getPartnerVoiceState,
  partnerVoiceAccept,
  partnerVoiceReject,
  partnerVoiceNavigateToCall
} from '../services/partnerVoiceService.js';

export default {
  name: 'PartnerCallOverlay',
  setup() {
    onMounted(() => {
      // best-effort connect (App also auto-connects)
      ensurePartnerVoiceConnected();
    });

    const { incomingCalls, isConnected } = getPartnerVoiceState();
    const topIncoming = computed(() => incomingCalls.value[0] || null);
    const hasIncoming = computed(() => incomingCalls.value.length > 0);

    const accept = () => {
      const call = topIncoming.value;
      if (!call?.conversationId) return;
      partnerVoiceAccept(call.conversationId);
      partnerVoiceNavigateToCall(call.conversationId);
    };

    const reject = () => {
      const call = topIncoming.value;
      if (!call?.conversationId) return;
      partnerVoiceReject(call.conversationId);
    };

    return () => {
      // Only show for logged-in partner sessions
      const token = localStorage.getItem('partner_token');
      if (!token) return null;
      if (!hasIncoming.value) return null;

      const call = topIncoming.value;
      const fromName = call?.from?.name || call?.from?.email || 'User';

      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(2,6,23,0.55)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              borderRadius: 18,
              background: 'linear-gradient(180deg, #0b1224 0%, #060a16 100%)',
              border: '1px solid rgba(148,163,184,0.15)',
              boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
              padding: 20,
              color: 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(148,163,184,0.9)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Incoming voice call
                </div>
                <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                  {fromName}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(148,163,184,0.9)' }}>
                  {isConnected.value ? 'Ringing...' : 'Connecting...'}
                </div>
              </div>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.25)' }}>
                <span style={{ fontSize: 22 }}>📞</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <button
                onClick={reject}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
              <button
                onClick={accept}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 9999,
                  border: 'none',
                  background: '#22c55e',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Accept
              </button>
            </div>

            {incomingCalls.value.length > 1 && (
              <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(148,163,184,0.9)' }}>
                +{incomingCalls.value.length - 1} more incoming call(s)
              </div>
            )}
          </div>
        </div>
      );
    };
  }
};

