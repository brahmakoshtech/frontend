import { ref } from 'vue';
import { io } from 'socket.io-client';
import router from '../router/index.js';

const HISTORY_KEY = 'partner_voice_call_history_v1';

const socketRef = ref(null);
const isConnected = ref(false);

// Active incoming ringing calls
const incomingCalls = ref([]);

// Persistent call history (completed + missed + rejected + etc.)
const callHistory = ref(loadHistory());

// Buffer signals per conversationId so calls can be accepted from any page
const signalBufferByConversationId = new Map();
const signalSubscribers = new Set();

let listenersAttached = false;
let autoConnectTimer = null;
let lastToken = null;

function nowIso() {
  return new Date().toISOString();
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  const parsed = raw ? safeParse(raw, []) : [];
  return Array.isArray(parsed) ? parsed : [];
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore quota / private mode issues
  }
}

function upsertHistory(conversationId, patch) {
  const idx = callHistory.value.findIndex((c) => c.conversationId === conversationId);
  if (idx === -1) {
    callHistory.value.unshift({
      conversationId,
      createdAt: nowIso(),
      ...patch
    });
  } else {
    callHistory.value[idx] = { ...callHistory.value[idx], ...patch };
  }
  // cap history to keep it light
  if (callHistory.value.length > 100) {
    callHistory.value = callHistory.value.slice(0, 100);
  }
  saveHistory(callHistory.value);
}

function pushSignalToBuffer(conversationId, signal) {
  const existing = signalBufferByConversationId.get(conversationId) || [];
  existing.push({ receivedAt: nowIso(), signal });
  // cap per conversation
  if (existing.length > 50) existing.splice(0, existing.length - 50);
  signalBufferByConversationId.set(conversationId, existing);
}

export function consumePartnerVoiceSignals(conversationId) {
  const buf = signalBufferByConversationId.get(conversationId) || [];
  signalBufferByConversationId.delete(conversationId);
  return buf;
}

export function subscribePartnerVoiceSignals(handler) {
  signalSubscribers.add(handler);
  return () => {
    signalSubscribers.delete(handler);
  };
}

function emitToSignalSubscribers(payload) {
  signalSubscribers.forEach((fn) => {
    try {
      fn(payload);
    } catch (e) {
      // ignore subscriber errors
      console.error('[partnerVoiceService] signal subscriber error:', e?.message || e);
    }
  });
}

export function ensurePartnerVoiceConnected() {
  const token = localStorage.getItem('partner_token');
  if (!token) return;
  if (socketRef.value) return;

  socketRef.value = io(import.meta.env.VITE_WS_URL || 'https://prod.brahmakosh.com', {
    path: '/socket.io/',
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true
  });

  if (listenersAttached) return;
  listenersAttached = true;

  socketRef.value.on('connect', () => {
    isConnected.value = true;
  });

  socketRef.value.on('disconnect', () => {
    isConnected.value = false;
  });

  socketRef.value.on('voice:call:incoming', (payload) => {
    if (!payload?.conversationId) return;

    // Avoid duplicates
    const exists = incomingCalls.value.some((c) => c.conversationId === payload.conversationId);
    if (!exists) {
      incomingCalls.value.unshift({
        ...payload,
        receivedAt: nowIso()
      });
    }

    upsertHistory(payload.conversationId, {
      direction: 'incoming',
      status: 'ringing',
      from: payload.from || null,
      to: payload.to || null,
      startedAt: payload.startedAt || null,
      lastEventAt: nowIso()
    });
  });

  socketRef.value.on('voice:call:accepted', (payload) => {
    const conversationId = payload?.conversationId;
    if (!conversationId) return;
    incomingCalls.value = incomingCalls.value.filter((c) => c.conversationId !== conversationId);
    upsertHistory(conversationId, { status: 'in_call', lastEventAt: nowIso() });
  });

  socketRef.value.on('voice:call:rejected', (payload) => {
    const conversationId = payload?.conversationId;
    if (conversationId) {
      incomingCalls.value = incomingCalls.value.filter((c) => c.conversationId !== conversationId);
      upsertHistory(conversationId, { status: 'rejected', lastEventAt: nowIso(), endedAt: nowIso() });
    }
  });

  socketRef.value.on('voice:call:ended', (payload) => {
    const conversationId = payload?.conversationId;
    if (conversationId) {
      incomingCalls.value = incomingCalls.value.filter((c) => c.conversationId !== conversationId);
      upsertHistory(conversationId, { status: 'ended', lastEventAt: nowIso(), endedAt: nowIso() });
    }
  });

  socketRef.value.on('voice:signal', (payload) => {
    const { conversationId, signal } = payload || {};
    if (!conversationId || !signal) return;
    pushSignalToBuffer(conversationId, signal);
    emitToSignalSubscribers({ conversationId, signal });
  });
}

export function disconnectPartnerVoice() {
  if (socketRef.value) {
    try {
      socketRef.value.disconnect();
    } catch {
      // ignore
    }
  }
  socketRef.value = null;
  isConnected.value = false;
  listenersAttached = false;
}

export function startPartnerVoiceAutoConnect(pollMs = 1200) {
  if (autoConnectTimer) return;
  autoConnectTimer = setInterval(() => {
    const token = localStorage.getItem('partner_token');
    if (token && !socketRef.value) {
      lastToken = token;
      ensurePartnerVoiceConnected();
    } else if (!token && socketRef.value) {
      lastToken = null;
      disconnectPartnerVoice();
    } else if (token && lastToken && token !== lastToken) {
      // token changed (re-login)
      lastToken = token;
      disconnectPartnerVoice();
      ensurePartnerVoiceConnected();
    }
  }, pollMs);
}

export function getPartnerVoiceState() {
  return {
    socket: socketRef,
    isConnected,
    incomingCalls,
    callHistory
  };
}

export function partnerVoiceNavigateToCall(conversationId) {
  if (!conversationId) return;
  router.push({
    name: 'PartnerVoiceCall',
    query: { conversationId }
  });
}

export function partnerVoiceAccept(conversationId) {
  if (!conversationId || !socketRef.value || !isConnected.value) return false;
  socketRef.value.emit('voice:call:accept', { conversationId });
  incomingCalls.value = incomingCalls.value.filter((c) => c.conversationId !== conversationId);
  upsertHistory(conversationId, { status: 'in_call', lastEventAt: nowIso() });
  return true;
}

export function partnerVoiceReject(conversationId) {
  if (!conversationId || !socketRef.value || !isConnected.value) return false;
  socketRef.value.emit('voice:call:reject', { conversationId });
  incomingCalls.value = incomingCalls.value.filter((c) => c.conversationId !== conversationId);
  upsertHistory(conversationId, { status: 'rejected', lastEventAt: nowIso(), endedAt: nowIso() });
  return true;
}

export function partnerVoiceEnd(conversationId) {
  if (!conversationId || !socketRef.value || !isConnected.value) return false;
  socketRef.value.emit('voice:call:end', { conversationId });
  upsertHistory(conversationId, { status: 'ended', lastEventAt: nowIso(), endedAt: nowIso() });
  return true;
}

