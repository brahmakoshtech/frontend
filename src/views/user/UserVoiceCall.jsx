import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { io } from 'socket.io-client';
import api from '../../services/api.js';

export default {
  name: 'UserVoiceCall',
  setup() {
    const route = useRoute();
    const socket = ref(null);
    const isConnected = ref(false);
    const status = ref('idle'); // 'idle' | 'ringing' | 'in_call' | 'ended'
    const info = ref(null); // call payload

    const peerConnection = ref(null);
    const localStream = ref(null);
    const remoteStream = ref(null);
    const activeConversationId = ref(null);
    const localTracksAdded = ref(false);
    const pendingIceCandidates = ref([]);
    const mediaRecorder = ref(null);
    const recordedChunks = ref([]);
    const isMuted = ref(false);

    const createPeerConnection = (conversationId) => {
      if (peerConnection.value) return peerConnection.value;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket.value && activeConversationId.value) {
          socket.value.emit('voice:signal', {
            conversationId: activeConversationId.value,
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
        const audioEl = document.getElementById('user-voice-remote-audio');
        if (audioEl) {
          audioEl.srcObject = remoteStream.value;
          audioEl.play().catch(() => {});
        }
      };

      peerConnection.value = pc;
      activeConversationId.value = conversationId;
      return pc;
    };

    const destroyPeerConnection = () => {
      if (peerConnection.value) {
        peerConnection.value.getSenders().forEach((sender) => {
          if (sender.track) sender.track.stop();
        });
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
      activeConversationId.value = null;
      localTracksAdded.value = false;
      pendingIceCandidates.value = [];
      mediaRecorder.value = null;
      recordedChunks.value = [];
      status.value = 'ended';
    };

    const ensureLocalStream = async () => {
      if (localStream.value) return localStream.value;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.value = stream;
      const audioEl = document.getElementById('user-voice-local-audio');
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

    const startRecording = () => {
      if (!localStream.value || mediaRecorder.value) return;
      try {
        const mr = new MediaRecorder(localStream.value);
        mediaRecorder.value = mr;
        recordedChunks.value = [];
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunks.value.push(e.data);
          }
        };
        mr.start();
      } catch (e) {
        console.warn('MediaRecorder not available for user voice:', e?.message);
      }
    };

    const stopRecording = async () => {
      return new Promise((resolve) => {
        if (!mediaRecorder.value) return resolve();
        const mr = mediaRecorder.value;
        mediaRecorder.value = null;
        try {
          mr.onstop = () => resolve();
          mr.stop();
        } catch {
          resolve();
        }
      });
    };

    const uploadRecording = async (conversationId) => {
      if (!conversationId || recordedChunks.value.length === 0) return;
      const blob = new Blob(recordedChunks.value, { type: 'audio/webm' });
      try {
        const { data: presigned } = await api.post('/chat/voice/recording/upload-url', {
          conversationId,
          role: 'user'
        });
        const uploadUrl = presigned?.data?.uploadUrl;
        const key = presigned?.data?.key;
        if (!uploadUrl || !key) return;

        await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'audio/webm' }
        });

        await api.patch(`/chat/conversations/${conversationId}/voice-recording`, {
          audioKey: key
        });
      } catch (e) {
        console.warn('Failed to upload user call recording:', e?.message);
      }
    };

    const toggleMute = () => {
      if (!localStream.value) return;
      isMuted.value = !isMuted.value;
      localStream.value.getAudioTracks().forEach((t) => {
        t.enabled = !isMuted.value;
      });
    };

    const startOutgoingCall = async (conversationId) => {
      if (!conversationId || !socket.value || !isConnected.value) return;
      try {
        const pc = createPeerConnection(conversationId);
        await ensureTracksAdded(pc);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        status.value = 'ringing';

        socket.value.emit('voice:call:initiate', { conversationId }, (res) => {
          if (!res?.success) {
            console.error('Failed to initiate call:', res);
            status.value = 'ended';
            destroyPeerConnection();
          } else {
            console.log('Voice call initiated (user side):', res);
          }
        });

        socket.value.emit('voice:signal', {
          conversationId,
          signal: { type: 'offer', sdp: pc.localDescription }
        });
        startRecording();
      } catch (err) {
        console.error('Failed to start outgoing call (user):', err);
        status.value = 'ended';
        destroyPeerConnection();
      }
    };

    const connectSocket = () => {
      const token = localStorage.getItem('token_user');
      if (!token) {
        console.error('No user token found for voice call');
        return;
      }

      socket.value = io(import.meta.env.VITE_WS_URL || 'https://prod.brahmakosh.com', {
        path: '/socket.io/',
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true
      });

      socket.value.on('connect', () => {
        isConnected.value = true;
        const convId = route.query.conversationId;
        if (convId && !activeConversationId.value) {
          startOutgoingCall(convId);
        }
      });

      socket.value.on('disconnect', () => {
        isConnected.value = false;
      });

      socket.value.on('voice:call:incoming', (payload) => {
        // This page is mainly for answering calls; treat incoming as ringing
        info.value = payload;
        status.value = 'ringing';
      });

      socket.value.on('voice:call:accepted', (payload) => {
        console.log('Call accepted (user side):', payload);
        status.value = 'in_call';
      });

      socket.value.on('voice:call:rejected', () => {
        status.value = 'ended';
      });

      socket.value.on('voice:call:ended', () => {
        destroyPeerConnection();
      });

      socket.value.on('voice:signal', async (payload) => {
        const { conversationId, signal } = payload || {};
        if (!conversationId || !signal) return;

        if (!peerConnection.value || activeConversationId.value !== conversationId) {
          createPeerConnection(conversationId);
        }
        const pc = peerConnection.value;

        try {
          if (signal.type === 'offer') {
            await ensureTracksAdded(pc);

            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.value.emit('voice:signal', {
              conversationId,
              signal: { type: 'answer', sdp: pc.localDescription }
            });
            // Flush buffered ICE
            for (const cand of pendingIceCandidates.value) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            pendingIceCandidates.value = [];
            status.value = 'in_call';
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
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
          console.error('WebRTC error (user voice):', err);
        }
      });
    };

    const acceptCall = async () => {
      if (!info.value || !socket.value || !isConnected.value) return;
      const conversationId = info.value.conversationId;
      try {
        const pc = createPeerConnection(conversationId);
        await ensureTracksAdded(pc);
        startRecording();
        socket.value.emit('voice:call:accept', { conversationId });
        status.value = 'in_call';
      } catch (err) {
        console.error('Failed to accept call:', err);
        destroyPeerConnection();
      }
    };

    const rejectCall = () => {
      if (!info.value || !socket.value || !isConnected.value) return;
      socket.value.emit('voice:call:reject', { conversationId: info.value.conversationId });
      status.value = 'ended';
      info.value = null;
      destroyPeerConnection();
    };

    const endCall = () => {
      if (!activeConversationId.value || !socket.value || !isConnected.value) {
        const convId = activeConversationId.value;
        stopRecording().then(() => uploadRecording(convId)).finally(() => {
          destroyPeerConnection();
        });
        return;
      }
      const convId = activeConversationId.value;
      socket.value.emit('voice:call:end', { conversationId: convId });
      stopRecording().then(() => uploadRecording(convId)).finally(() => {
        destroyPeerConnection();
      });
    };

    onMounted(() => {
      connectSocket();
    });

    onUnmounted(() => {
      destroyPeerConnection();
      if (socket.value) {
        socket.value.disconnect();
      }
    });

    return () => (
      <div style="display:flex; flex-direction:column; height:calc(100vh - 64px); align-items:center; justify-content:center; background:#0f172a; color:white;">
        <div style="background:#020617; padding:24px 32px; border-radius:16px; box-shadow:0 20px 40px rgba(0,0,0,0.6); min-width:320px; text-align:center;">
          <h2 style="margin-bottom:8px; font-size:22px;">Voice Consultation</h2>
          <p style="margin:0 0 16px 0; font-size:13px; color:#9ca3af;">
            Status: <strong>{status.value}</strong> {isConnected.value ? '' : ' (connecting...)'}
          </p>

          {status.value === 'ringing' && info.value && (
            <>
              <p style="margin-bottom:12px;">
                Incoming call from <strong>{info.value.from?.name || 'Partner'}</strong>
              </p>
              <div style="display:flex; gap:12px; justify-content:center; margin-bottom:8px;">
                <button
                  onClick={acceptCall}
                  style="padding:10px 16px; background:#22c55e; border:none; border-radius:9999px; color:white; font-weight:600; cursor:pointer;"
                >
                  Accept
                </button>
                <button
                  onClick={rejectCall}
                  style="padding:10px 16px; background:#ef4444; border:none; border-radius:9999px; color:white; font-weight:600; cursor:pointer;"
                >
                  Reject
                </button>
              </div>
            </>
          )}

          {status.value === 'in_call' && (
            <>
              <p style="margin-bottom:12px;">You are in a live voice session.</p>
              <button
                onClick={endCall}
                style="padding:10px 16px; background:#ef4444; border:none; border-radius:9999px; color:white; font-weight:600; cursor:pointer;"
              >
                End Call
              </button>
            </>
          )}

          {status.value === 'idle' && (
            <p style="margin-top:12px; font-size:13px; color:#9ca3af;">
              Waiting for an incoming call...
            </p>
          )}

          {status.value === 'ended' && (
            <p style="margin-top:12px; font-size:13px; color:#9ca3af;">
              Call ended. You can close this page.
            </p>
          )}
        </div>

        {/* Hidden audio elements */}
        <audio id="user-voice-local-audio" style="display:none" playsInline muted />
        <audio id="user-voice-remote-audio" style="display:none" playsInline />
      </div>
    );
  }
};

