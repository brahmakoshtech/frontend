import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  consumePartnerVoiceSignals,
  ensurePartnerVoiceConnected,
  getPartnerVoiceState,
  partnerVoiceAccept,
  partnerVoiceEnd,
  partnerVoiceReject,
  subscribePartnerVoiceSignals
} from '../../services/partnerVoiceService.js';

export default {
  name: 'PartnerVoiceCall',
  setup() {
    const route = useRoute();

    const { socket, isConnected, incomingCalls, callHistory } = getPartnerVoiceState();

    const status = ref('idle'); // 'idle' | 'calling' | 'ringing' | 'in_call' | 'ended'
    const targetConversationId = ref(null);

    const peerConnection = ref(null);
    const localStream = ref(null);
    const remoteStream = ref(null);
    const localTracksAdded = ref(false);
    const pendingIceCandidates = ref([]);
    let unsubscribeSignals = null;

    const createPeerConnection = (conversationId) => {
      if (peerConnection.value) return peerConnection.value;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket.value && targetConversationId.value) {
          socket.value.emit('voice:signal', {
            conversationId: targetConversationId.value,
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate
            }
          });
        }
      };

      pc.ontrack = (event) => {
        if (!remoteStream.value) {
          remoteStream.value = new MediaStream();
        }
        remoteStream.value.addTrack(event.track);
        const audioEl = document.getElementById('partner-voice-remote-full-audio');
        if (audioEl) {
          audioEl.srcObject = remoteStream.value;
          audioEl.play().catch(() => {});
        }
      };

      peerConnection.value = pc;
      targetConversationId.value = conversationId;
      return pc;
    };

    const destroyPeerConnection = () => {
      if (peerConnection.value) {
        peerConnection.value.getSenders().forEach((sender) => sender.track && sender.track.stop());
        peerConnection.value.close();
      }
      peerConnection.value = null;

      if (localStream.value) {
        localStream.value.getTracks().forEach((t) => t.stop());
      }
      localStream.value = null;

      if (remoteStream.value) {
        remoteStream.value.getTracks().forEach((t) => t.stop());
      }
      remoteStream.value = null;
      localTracksAdded.value = false;
      pendingIceCandidates.value = [];
      status.value = 'ended';
    };

    const ensureLocalStream = async () => {
      if (localStream.value) return localStream.value;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.value = stream;
      const audioEl = document.getElementById('partner-voice-local-full-audio');
      if (audioEl) {
        audioEl.srcObject = stream;
        audioEl.muted = true;
        audioEl.play().catch(() => {});
      }
      return stream;
    };

    const ensureTracksAdded = async (pc) => {
      if (localTracksAdded.value) return;
      const stream = await ensureLocalStream();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      localTracksAdded.value = true;
    };

    const handleSignal = async (conversationId, signal) => {
      if (!conversationId || !signal) return;

      if (!peerConnection.value || targetConversationId.value !== conversationId) {
        createPeerConnection(conversationId);
      }
      const pc = peerConnection.value;

      try {
        if (signal.type === 'offer') {
          await ensureTracksAdded(pc);
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.value?.emit('voice:signal', {
            conversationId,
            signal: { type: 'answer', sdp: pc.localDescription }
          });
          // Flush any ICE candidates that arrived early
          for (const cand of pendingIceCandidates.value) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingIceCandidates.value = [];
          status.value = 'in_call';
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          // Flush buffered ICE now that remoteDescription is set
          for (const cand of pendingIceCandidates.value) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingIceCandidates.value = [];
          status.value = 'in_call';
        } else if (signal.type === 'ice-candidate' && signal.candidate) {
          if (!pc.remoteDescription) {
            pendingIceCandidates.value.push(signal.candidate);
          } else {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('WebRTC error (partner voice):', err);
      }
    };

    const startCall = async () => {
      const convId = prompt('Enter conversationId to call (from chat):');
      if (!convId || !socket.value || !isConnected.value) return;
      targetConversationId.value = convId;
      try {
        status.value = 'calling';
        const pc = createPeerConnection(convId);
        await ensureTracksAdded(pc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.value.emit('voice:call:initiate', { conversationId: convId }, (res) => {
          if (!res?.success) {
            alert(res?.message || 'Failed to start call');
            destroyPeerConnection();
          } else {
            console.log('Call initiated:', res);
          }
        });

        socket.value.emit('voice:signal', {
          conversationId: convId,
          signal: { type: 'offer', sdp: pc.localDescription }
        });
      } catch (err) {
        console.error('Failed to start call:', err);
        alert(err.message || 'Failed to start call');
        destroyPeerConnection();
      }
    };

    const acceptIncoming = async () => {
      if (!targetConversationId.value || !socket.value || !isConnected.value) return;
      try {
        const convId = targetConversationId.value;
        const pc = createPeerConnection(convId);
        await ensureTracksAdded(pc);
        partnerVoiceAccept(convId);
        status.value = 'in_call';
      } catch (err) {
        console.error('Failed to accept incoming call (partner):', err);
        destroyPeerConnection();
      }
    };

    const rejectIncoming = () => {
      if (!targetConversationId.value || !socket.value || !isConnected.value) return;
      partnerVoiceReject(targetConversationId.value);
      status.value = 'ended';
      destroyPeerConnection();
    };

    const endCall = () => {
      if (!targetConversationId.value || !socket.value || !isConnected.value) {
        destroyPeerConnection();
        return;
      }
      partnerVoiceEnd(targetConversationId.value);
      destroyPeerConnection();
    };

    onMounted(() => {
      ensurePartnerVoiceConnected();

      // If navigated with a conversationId, focus it
      const convFromRoute = route.query.conversationId;
      if (convFromRoute && typeof convFromRoute === 'string') {
        targetConversationId.value = convFromRoute;
      } else if (incomingCalls.value.length > 0) {
        targetConversationId.value = incomingCalls.value[0].conversationId;
        status.value = 'ringing';
      }

      // Subscribe to live signals
      unsubscribeSignals = subscribePartnerVoiceSignals(({ conversationId, signal }) => {
        if (!conversationId || !signal) return;
        if (!targetConversationId.value) targetConversationId.value = conversationId;
        if (targetConversationId.value === conversationId && status.value === 'idle') {
          status.value = 'ringing';
        }
        handleSignal(conversationId, signal);
      });

      // Replay buffered signals if any
      if (targetConversationId.value) {
        const buffered = consumePartnerVoiceSignals(targetConversationId.value);
        buffered.forEach(({ signal }) => handleSignal(targetConversationId.value, signal));
      }
    });

    onUnmounted(() => {
      destroyPeerConnection();
      if (unsubscribeSignals) unsubscribeSignals();
    });

    const ringingCalls = computed(() => incomingCalls.value);
    const completedCalls = computed(() => callHistory.value.filter((c) => c.status && c.status !== 'ringing'));

    return () => (
      <div style="display:flex; flex-direction:column; height:calc(100vh - 64px); background:#020617; color:white; padding:16px;">
        <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style="background:#0b1120; padding:16px; border-radius:16px; border:1px solid rgba(148,163,184,0.12);">
            <h3 style="margin:0 0 10px 0; font-size:16px;">Ringing calls</h3>
            {ringingCalls.value.length === 0 ? (
              <p style="margin:0; font-size:13px; color:#9ca3af;">No ringing calls right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ringingCalls.value.map((c) => (
                  <div key={c.conversationId} style={{ padding: 12, borderRadius: 12, background: '#020617', border: '1px solid rgba(245,158,11,0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.from?.name || c.from?.email || 'User'}
                        </div>
                        <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 4 }}>Ringing…</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            targetConversationId.value = c.conversationId;
                            status.value = 'ringing';
                          }}
                          style="padding:8px 10px; background:#1f2937; color:white; border:1px solid rgba(148,163,184,0.18); border-radius:9999px; cursor:pointer; font-weight:700;"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => {
                            targetConversationId.value = c.conversationId;
                            acceptIncoming();
                          }}
                          style="padding:8px 10px; background:#22c55e; color:white; border:none; border-radius:9999px; cursor:pointer; font-weight:800;"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            targetConversationId.value = c.conversationId;
                            rejectIncoming();
                          }}
                          style="padding:8px 10px; background:#ef4444; color:white; border:none; border-radius:9999px; cursor:pointer; font-weight:800;"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style="background:#0b1120; padding:16px; border-radius:16px; border:1px solid rgba(148,163,184,0.12);">
            <h3 style="margin:0 0 10px 0; font-size:16px;">Completed calls</h3>
            {completedCalls.value.length === 0 ? (
              <p style="margin:0; font-size:13px; color:#9ca3af;">No calls completed yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto', paddingRight: 6 }}>
                {completedCalls.value.slice(0, 20).map((c) => (
                  <div key={c.conversationId} style={{ padding: 12, borderRadius: 12, background: '#020617', border: '1px solid rgba(148,163,184,0.12)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.from?.name || c.from?.email || 'User'}
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                          Status: <strong style={{ color: 'white' }}>{c.status}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => {
                            targetConversationId.value = c.conversationId;
                            status.value = 'idle';
                          }}
                          style="padding:8px 10px; background:#1f2937; color:white; border:1px solid rgba(148,163,184,0.18); border-radius:9999px; cursor:pointer; font-weight:700;"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 640, width: '100%', margin: '16px auto 0', textAlign: 'center', background: '#0b1120', padding: '22px 26px', borderRadius: 16, border: '1px solid rgba(148,163,184,0.12)', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>
          <h2 style="margin-bottom:8px; font-size:22px;">Partner Voice Call</h2>
          <p style="margin:0 0 16px 0; font-size:13px; color:#9ca3af;">
            Status: <strong>{status.value}</strong> {isConnected.value ? '' : ' (connecting...)'}{' '}
            {targetConversationId.value ? (
              <>
                • Conversation: <code>{targetConversationId.value}</code>
              </>
            ) : null}
          </p>

          {status.value === 'idle' && (
            <button
              onClick={startCall}
              style="padding:10px 16px; background:#22c55e; border:none; border-radius:9999px; color:white; font-weight:600; cursor:pointer;"
            >
              Start Call (enter conversationId)
            </button>
          )}

          {status.value === 'ringing' && (
            <div style="display:flex; flex-direction:column; gap:12px; align-items:center; margin-top:12px;">
              <p style="font-size:13px; color:#e5e7eb;">
                Incoming voice call for conversation <code>{targetConversationId.value}</code>
              </p>
              <div style="display:flex; gap:10px;">
                <button
                  onClick={acceptIncoming}
                  style="padding:10px 16px; background:#22c55e; border:none; border-radius:9999px; color:white; font-weight:600; cursor:pointer;"
                >
                  Accept
                </button>
                <button
                  onClick={rejectIncoming}
                  style="padding:10px 16px; background:#ef4444; border:none; border-radius:9999px; color:white; font-weight:600; cursor:pointer;"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {status.value === 'calling' && (
            <p style="margin-top:12px; font-size:13px; color:#e5e7eb;">
              Calling user for conversation <code>{targetConversationId.value}</code>...
            </p>
          )}

          {status.value === 'in_call' && (
            <button
              onClick={endCall}
              style="padding:10px 16px; background:#ef4444; border:none; border-radius:9999px; color:white; font-weight:600; cursor:pointer;"
            >
              End Call
            </button>
          )}

          {status.value === 'ended' && (
            <p style="margin-top:12px; font-size:13px; color:#9ca3af;">Call ended.</p>
          )}
        </div>

        {/* Hidden audio elements */}
        <audio id="partner-voice-local-full-audio" style="display:none" playsInline muted />
        <audio id="partner-voice-remote-full-audio" style="display:none" playsInline />
      </div>
    );
  }
};

