import { ref } from 'vue';
import { io } from 'socket.io-client';
import { getSocketServerUrl } from '../utils/socketUrl.js';

const socketRef = ref(null);
const isConnected = ref(false);
let listenersAttached = false;
let lastToken = null;
let connectRefCount = 0;

export function getPartnerSocketRef() {
  return socketRef;
}

export function getPartnerSocketConnectedRef() {
  return isConnected;
}

function attachCoreListeners() {
  if (listenersAttached || !socketRef.value) return;
  listenersAttached = true;

  socketRef.value.on('connect', () => {
    isConnected.value = true;
  });

  socketRef.value.on('disconnect', () => {
    isConnected.value = false;
  });
}

export function connectPartnerSocket() {
  connectRefCount += 1;

  const token = localStorage.getItem('partner_token');
  if (!token) return null;

  if (socketRef.value && lastToken && lastToken !== token) {
    disconnectPartnerSocket(true);
    connectRefCount = 1;
  }

  if (!socketRef.value) {
    lastToken = token;
    socketRef.value = io(getSocketServerUrl(), {
      path: '/socket.io/',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000
    });
    attachCoreListeners();
  }

  return socketRef.value;
}

export function disconnectPartnerSocket(force = false) {
  if (!force) {
    connectRefCount = Math.max(0, connectRefCount - 1);
    if (connectRefCount > 0) return;
  } else {
    connectRefCount = 0;
  }

  if (socketRef.value) {
    try {
      socketRef.value.removeAllListeners();
      socketRef.value.disconnect();
    } catch {
      // ignore
    }
  }

  socketRef.value = null;
  isConnected.value = false;
  listenersAttached = false;
  lastToken = null;
}
