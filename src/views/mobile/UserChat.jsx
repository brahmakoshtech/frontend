import { ref, onMounted, onUnmounted, computed } from 'vue';
import io from 'socket.io-client';
import api from '../../services/api.js';

export default {
  name: 'UserChat',
  setup() {
    // State
    const socket = ref(null);
    const isConnected = ref(false);
    const loading = ref(false);
    const showPartnersList = ref(true);
    
    // Data
    const partners = ref([]);
    const conversations = ref([]);
    const selectedConversation = ref(null);
    const selectedPartner = ref(null);
    const messages = ref([]);
    const newMessage = ref('');
    const typingUsers = ref(new Set());
    const showAstrologyForm = ref(false);
    
    // Astrology form data
    const astrologyData = ref({
      name: '',
      dateOfBirth: '',
      timeOfBirth: '',
      placeOfBirth: '',
      gowthra: '',
      zodiacSign: '',
      moonSign: '',
      ascendant: '',
      additionalInfo: ''
    });
    
    // User info and profile (for auto-fill birth details)
    const userInfo = ref({
      id: null,
      email: null
    });
    const userProfile = ref(null);
    
    // Typing timeout
    let typingTimeout = null;
    let messagePollInterval = null;
    
    // WebSocket Connection
    const connectWebSocket = () => {
      const token = localStorage.getItem('token_user'); // ✅ FIXED: Changed from 'partner_token' to 'token_user'
      
      if (!token) {
        console.error('❌ No user token found');
        return;
      }
      
      console.log('🔌 Connecting to WebSocket...');
      console.log('🔑 Using token:', token.substring(0, 20) + '...');
      
      // Disconnect existing socket if any
      if (socket.value) {
        socket.value.disconnect();
      }
      
      // In dev, use same origin (Vite proxy forwards). In prod, use VITE_WS_URL or derive from VITE_API_URL.
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const wsUrl = import.meta.env.VITE_WS_URL
        || (apiUrl ? apiUrl.replace(/\/api\/?$/, '') : null)
        || (import.meta.env.DEV ? window.location.origin : 'http://localhost:5000');
      socket.value = io(wsUrl, {
        path: '/socket.io/',
        auth: { 
          token: token  // Send token in auth object
        },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      // Connection events
      socket.value.on('connect', () => {
        console.log('✅ WebSocket connected');
        console.log('📍 Socket ID:', socket.value.id);
        isConnected.value = true;
        if (messagePollInterval) {
          clearInterval(messagePollInterval);
          messagePollInterval = null;
        }
      });
      
      socket.value.on('connected', (data) => {
        console.log('✅ Server acknowledged connection:', data);
        if (data.userId) {
          userInfo.value.id = data.userId;
        }
      });
      
      socket.value.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected, reason:', reason);
        isConnected.value = false;
      });
      
      socket.value.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        console.error('Error details:', error);
      });
      
      socket.value.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
      
      // Message events
      socket.value.on('message:new', (data) => {
        console.log('📨 New message received:', data);
        
        if (selectedConversation.value?.conversationId === data.conversationId) {
          messages.value.push(data.message);
          scrollToBottom();
          
          // Mark as read immediately if conversation is open
          markMessagesAsRead(data.conversationId);
        } else {
          // Update unread count in conversations list
          const conv = conversations.value.find(c => c.conversationId === data.conversationId);
          if (conv) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
            conv.lastMessage = data.message;
            conv.lastMessageAt = data.message.createdAt;
          }
        }
      });
      
      socket.value.on('message:delivered', (data) => {
        const msg = messages.value.find(m => m._id === data.messageId);
        if (msg) {
          msg.isDelivered = true;
          msg.deliveredAt = data.deliveredAt;
        }
      });
      
      socket.value.on('message:read:receipt', (data) => {
        console.log('✅ Messages read by partner:', data);
        
        if (data.messageIds === 'all') {
          messages.value.forEach(msg => {
            if (msg.senderModel === 'User') {
              msg.isRead = true;
              msg.readAt = data.readAt;
            }
          });
        } else {
          data.messageIds.forEach(msgId => {
            const msg = messages.value.find(m => m._id === msgId);
            if (msg) {
              msg.isRead = true;
              msg.readAt = data.readAt;
            }
          });
        }
      });
      
      // Typing events
      socket.value.on('typing:status', (data) => {
        if (selectedConversation.value?.conversationId === data.conversationId) {
          if (data.isTyping) {
            typingUsers.value.add(data.partnerId || data.userId);
          } else {
            typingUsers.value.delete(data.partnerId || data.userId);
          }
        }
      });
      
      // Conversation events
      socket.value.on('conversation:partner:joined', (data) => {
        console.log('👤 Partner joined conversation:', data);
      });
      
      socket.value.on('conversation:accepted', async (data) => {
        console.log('✅ Conversation accepted:', data);
        
        // Move from pending to active
        const pendingConv = conversations.value.find(c => c.conversationId === data.conversationId);
        if (pendingConv) {
          pendingConv.status = 'accepted';
          pendingConv.isAcceptedByPartner = true;
        }
        
        // Reload conversations
        await loadConversations();
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Consultation Accepted', {
            body: `${data.partnerName || 'Partner'} has accepted your consultation request`,
            icon: '/logo.png'
          });
        }
      });
      
      socket.value.on('conversation:rejected', async (data) => {
        console.log('❌ Conversation rejected:', data);
        
        // Remove from conversations
        conversations.value = conversations.value.filter(
          c => c.conversationId !== data.conversationId
        );
        
        // Show notification
        alert(`Your consultation request was declined. Reason: ${data.reason || 'Partner is unavailable'}`);
        
        // Reload conversations
        await loadConversations();
      });
    };
    
    // Load user profile for auto-fill (birth details)
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token) return;
        const response = await api.getCurrentUser(token);
        if (response?.success && response?.data?.user) {
          const u = response.data.user;
          userProfile.value = u;
          if (u._id) userInfo.value.id = u._id;
          if (u.email) userInfo.value.email = u.email;
        }
      } catch (e) {
        console.warn('[UserChat] Could not load user profile:', e?.message);
      }
    };

    // Map user profile to astrology form and check if birth details are complete
    const fillAstrologyFromProfile = () => {
      const u = userProfile.value;
      if (!u?.profile) return false;
      const p = u.profile;
      const dob = p.dob ? new Date(p.dob) : null;
      const dateStr = dob && !isNaN(dob.getTime())
        ? `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`
        : '';
      astrologyData.value = {
        name: p.name || u.email || '',
        dateOfBirth: dateStr,
        timeOfBirth: p.timeOfBirth || '',
        placeOfBirth: p.placeOfBirth || '',
        gowthra: p.gowthra || '',
        zodiacSign: astrologyData.value.zodiacSign || '',
        moonSign: astrologyData.value.moonSign || '',
        ascendant: astrologyData.value.ascendant || '',
        additionalInfo: astrologyData.value.additionalInfo || ''
      };
      return !!(p.name || u.email) && !!dateStr;
    };

    // Load available partners
    const loadPartners = async () => {
      loading.value = true;
      try {
        const response = await api.getAvailablePartners();
        console.log('📦 Partners response:', response);
        
        if (response && response.success) {
          partners.value = response.data || [];
          console.log('✅ Loaded partners:', partners.value.length);
        }
      } catch (error) {
        console.error('❌ Error loading partners:', error);
        partners.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    // Load conversations
    const loadConversations = async () => {
      loading.value = true;
      try {
        const response = await api.getConversations();
        console.log('📦 Conversations response:', response);
        
        if (response && response.success) {
          conversations.value = response.data || [];
          console.log('✅ Loaded conversations:', conversations.value.length);
        }
      } catch (error) {
        console.error('❌ Error loading conversations:', error);
        conversations.value = [];
      } finally {
        loading.value = false;
      }
    };
    
    // Select partner to start conversation
    const selectPartner = async (partner) => {
      console.log('👤 Selected partner:', partner);
      selectedPartner.value = partner;
      
      // Check if conversation already exists
      const existingConv = conversations.value.find(
        c => c.otherUser?._id === partner._id
      );
      
      if (existingConv) {
        console.log('ℹ️ Conversation already exists');
        selectConversation(existingConv);
        showPartnersList.value = false;
      } else {
        // Pre-fill from user profile; if birth details are complete, create request directly
        const hasCompleteDetails = fillAstrologyFromProfile();
        if (hasCompleteDetails) {
          console.log('✅ Birth details from profile - creating conversation directly');
          await createConversationRequest();
          showPartnersList.value = false;
        } else {
          showAstrologyForm.value = true;
        }
      }
    };
    
    // Create conversation request
    const createConversationRequest = async () => {
      if (!selectedPartner.value) return;
      
      try {
        loading.value = true;
        
        // Prepare astrology data (only include filled fields)
        const astroData = {};
        Object.keys(astrologyData.value).forEach(key => {
          if (astrologyData.value[key]) {
            astroData[key] = astrologyData.value[key];
          }
        });
        
        console.log('📤 Creating conversation request with astrology data:', astroData);
        
        const response = await api.createConversation({
          partnerId: selectedPartner.value._id,
          astrologyData: astroData
        });
        
        if (response && response.success) {
          console.log('✅ Conversation request created');
          
          // Add to conversations
          const conversation = response.data;
          conversations.value.unshift(conversation);
          
          // Select the new conversation
          selectConversation(conversation);
          
          // Hide form
          showAstrologyForm.value = false;
          showPartnersList.value = false;
          
          // Reset form
          resetAstrologyForm();
          
          // Show notification
          alert('Consultation request sent! Waiting for partner to accept.');
        }
      } catch (error) {
        console.error('❌ Error creating conversation:', error);
        alert(error.response?.data?.message || 'Failed to create conversation request');
      } finally {
        loading.value = false;
      }
    };
    
    // Reset astrology form
    const resetAstrologyForm = () => {
      astrologyData.value = {
        name: '',
        dateOfBirth: '',
        timeOfBirth: '',
        placeOfBirth: '',
        gowthra: '',
        zodiacSign: '',
        moonSign: '',
        ascendant: '',
        additionalInfo: ''
      };
    };
    
    // Cancel conversation request
    const cancelConversationRequest = () => {
      showAstrologyForm.value = false;
      selectedPartner.value = null;
      resetAstrologyForm();
    };
    
    // Select conversation
    const selectConversation = async (conversation) => {
      console.log('💬 Selecting conversation:', conversation);
      selectedConversation.value = conversation;
      messages.value = [];
      showPartnersList.value = false;
      
      // Join conversation via WebSocket if connected
      if (socket.value && isConnected.value) {
        socket.value.emit('conversation:join', 
          { conversationId: conversation.conversationId },
          async (response) => {
            if (response && response.success) {
              console.log('✅ Joined conversation');
              await loadMessages(conversation.conversationId);
            } else {
              console.error('❌ Failed to join conversation:', response?.message);
              // Fallback: load messages anyway
              await loadMessages(conversation.conversationId);
            }
          }
        );
      } else {
        // Load messages directly if WebSocket not connected
        await loadMessages(conversation.conversationId);
        // Poll for new messages when WebSocket is disconnected
        if (messagePollInterval) clearInterval(messagePollInterval);
        messagePollInterval = setInterval(() => {
          if (selectedConversation.value?.conversationId === conversation.conversationId && !isConnected.value) {
            loadMessages(conversation.conversationId);
          } else if (isConnected.value && messagePollInterval) {
            clearInterval(messagePollInterval);
            messagePollInterval = null;
          }
        }, 4000);
      }
    };
    
    // Load messages
    const loadMessages = async (conversationId) => {
      loading.value = true;
      try {
        const response = await api.getConversationMessages(conversationId);
        if (response && response.success) {
          messages.value = (response.data && response.data.messages) || [];
          console.log('✅ Loaded messages:', messages.value.length);
          scrollToBottom();
          
          // Mark as read
          markMessagesAsRead(conversationId);
        }
      } catch (error) {
        console.error('❌ Error loading messages:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Send message
    const sendMessage = () => {
      if (!newMessage.value.trim() || !selectedConversation.value) return;
      
      // Check if conversation is accepted
      if (selectedConversation.value.status === 'pending') {
        alert('Please wait for the partner to accept your consultation request');
        return;
      }
      
      const messageData = {
        conversationId: selectedConversation.value.conversationId,
        content: newMessage.value.trim(),
        messageType: 'text'
      };
      
      if (socket.value && isConnected.value) {
        socket.value.emit('message:send', messageData, (response) => {
          if (response && response.success) {
            console.log('✅ Message sent');
            newMessage.value = '';
            stopTyping();
          } else {
            console.error('❌ Failed to send message:', response?.message);
            alert(response?.message || 'Failed to send message');
          }
        });
      } else {
        // Fallback to REST API if WebSocket not connected
        api.sendMessage(selectedConversation.value.conversationId, messageData)
          .then(() => {
            console.log('✅ Message sent via REST');
            newMessage.value = '';
            loadMessages(selectedConversation.value.conversationId);
          })
          .catch(error => {
            console.error('❌ Failed to send message:', error);
            alert('Failed to send message');
          });
      }
    };
    
    // Typing indicators
    const startTyping = () => {
      if (!selectedConversation.value || !socket.value || !isConnected.value) return;
      
      socket.value.emit('typing:start', {
        conversationId: selectedConversation.value.conversationId
      });
      
      // Auto-stop typing after 3 seconds
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = setTimeout(stopTyping, 3000);
    };
    
    const stopTyping = () => {
      if (!selectedConversation.value || !socket.value || !isConnected.value) return;
      
      socket.value.emit('typing:stop', {
        conversationId: selectedConversation.value.conversationId
      });
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
    };
    
    // Mark messages as read
    const markMessagesAsRead = (conversationId) => {
      if (socket.value && isConnected.value) {
        socket.value.emit('message:read', { conversationId });
      } else {
        api.markMessagesAsRead(conversationId);
      }
    };
    
    // End conversation
    const endConversation = async () => {
      if (!selectedConversation.value) return;
      
      if (!confirm('Are you sure you want to end this consultation?')) return;
      
      try {
        await api.endConversation(selectedConversation.value.conversationId);
        
        console.log('✅ Conversation ended');
        
        // Remove from conversations list
        conversations.value = conversations.value.filter(
          c => c.conversationId !== selectedConversation.value.conversationId
        );
        
        selectedConversation.value = null;
        messages.value = [];
        showPartnersList.value = true;
        
        if (messagePollInterval) {
          clearInterval(messagePollInterval);
          messagePollInterval = null;
        }
        
        // Reload conversations
        await loadConversations();
      } catch (error) {
        console.error('❌ Error ending conversation:', error);
      }
    };
    
    // Back to partners list
    const backToPartnersList = () => {
      selectedConversation.value = null;
      messages.value = [];
      showPartnersList.value = true;
      if (messagePollInterval) {
        clearInterval(messagePollInterval);
        messagePollInterval = null;
      }
    };
    
    // Scroll to bottom of messages
    const scrollToBottom = () => {
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    };
    
    // Format time
    const formatTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };
    
    // Format date
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (d.toDateString() === today.toDateString()) return 'Today';
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    // Get partner status color
    const getStatusColor = (status) => {
      switch (status) {
        case 'online': return '#10b981';
        case 'busy': return '#f59e0b';
        case 'offline': return '#6b7280';
        default: return '#6b7280';
      }
    };
    
    // Get partner status text
    const getStatusText = (partner) => {
      if (partner.status === 'online' && !partner.isBusy) return 'Available';
      if (partner.status === 'online' && partner.isBusy) return 'Busy';
      if (partner.status === 'busy') return 'Busy';
      return 'Offline';
    };
    
    // Computed
    const isTyping = computed(() => typingUsers.value.size > 0);
    const unreadCount = computed(() => {
      return conversations.value.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    });
    const onlinePartners = computed(() => {
      return partners.value.filter(p => p.status === 'online');
    });
    const availablePartners = computed(() => {
      return partners.value.filter(p => p.status === 'online' && !p.isBusy);
    });
    
    // Request notification permission
    const requestNotificationPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };
    
    // Lifecycle
    onMounted(async () => {
      console.log('🚀 UserChat component mounted');
      await loadUserProfile();
      
      // Request notification permission
      requestNotificationPermission();
      
      // Connect WebSocket first
      connectWebSocket();
      
      // Load data
      await loadPartners();
      await loadConversations();
    });
    
    onUnmounted(() => {
      console.log('👋 UserChat component unmounting');
      if (messagePollInterval) {
        clearInterval(messagePollInterval);
        messagePollInterval = null;
      }
      if (socket.value) {
        if (selectedConversation.value) {
          socket.value.emit('conversation:leave', {
            conversationId: selectedConversation.value.conversationId
          });
        }
        socket.value.disconnect();
      }
    });
    
    return () => (
      <div style="display: flex; height: calc(100vh - 64px); background-color: #f9fafb;">
        {/* Sidebar */}
        <div style="width: 360px; background-color: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column;">
          {/* Header */}
          <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
              <h2 style="font-size: 20px; font-weight: 600; color: #111827; margin: 0;">
                {showPartnersList.value ? 'Available Partners' : 'My Consultations'}
              </h2>
              <div style={`width: 12px; height: 12px; border-radius: 50%; ${
                isConnected.value ? 'background-color: #10b981;' : 'background-color: #ef4444;'
              }`} title={isConnected.value ? 'Connected' : 'Disconnected'} />
            </div>
            
            {!showPartnersList.value && (
              <button
                onClick={() => showPartnersList.value = true}
                style="width: 100%; padding: 10px; background-color: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              >
                + New Consultation
              </button>
            )}
          </div>
          
          {/* List */}
          <div style="flex: 1; overflow-y: auto;">
            {showPartnersList.value ? (
              // Partners List
              partners.value.length === 0 ? (
                <div style="padding: 40px 20px; text-align: center; color: #6b7280;">
                  <svg style="width: 48px; height: 48px; margin: 0 auto 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No partners available</p>
                </div>
              ) : (
                <>
                  <div style="padding: 12px 16px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                      {availablePartners.value.length} available • {onlinePartners.value.length} online • {partners.value.length} total
                    </p>
                  </div>
                  {partners.value.map(partner => (
                    <div
                      key={partner._id}
                      onClick={() => selectPartner(partner)}
                      style="padding: 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background-color 0.2s;"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="position: relative;">
                          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                            {partner.name?.charAt(0) || partner.email?.charAt(0) || 'P'}
                          </div>
                          <div style={`position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background-color: ${getStatusColor(partner.status)}; border: 2px solid white; border-radius: 50%;`} />
                        </div>
                        <div style="flex: 1; min-width: 0;">
                          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <p style="font-weight: 600; color: #111827; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                              {partner.name || partner.email}
                            </p>
                            <span style={`font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; ${
                              partner.status === 'online' && !partner.isBusy
                                ? 'background-color: #d1fae5; color: #065f46;'
                                : 'background-color: #fef3c7; color: #92400e;'
                            }`}>
                              {getStatusText(partner)}
                            </span>
                          </div>
                          <p style="font-size: 13px; color: #6b7280; margin: 0 0 4px 0;">
                            {partner.specialization || 'Astrologer'}
                          </p>
                          <div style="display: flex; gap: 12px; font-size: 12px; color: #9ca3af;">
                            <span>⭐ {partner.rating?.toFixed(1) || '0.0'}</span>
                            <span>📊 {partner.totalSessions || 0} sessions</span>
                            <span>📅 {partner.experience || 0}y exp</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )
            ) : (
              // Conversations List
              conversations.value.length === 0 ? (
                <div style="padding: 40px 20px; text-align: center; color: #6b7280;">
                  <svg style="width: 48px; height: 48px; margin: 0 auto 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No consultations yet</p>
                  <button
                    onClick={() => showPartnersList.value = true}
                    style="margin-top: 16px; padding: 10px 20px; background-color: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;"
                  >
                    Find a Partner
                  </button>
                </div>
              ) : (
                conversations.value.map(conv => (
                  <div
                    key={conv.conversationId}
                    onClick={() => selectConversation(conv)}
                    style={`padding: 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background-color 0.2s; ${
                      selectedConversation.value?.conversationId === conv.conversationId
                        ? 'background-color: #eef2ff;'
                        : ''
                    }`}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => {
                      if (selectedConversation.value?.conversationId !== conv.conversationId) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <div style="position: relative;">
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                          {conv.otherUser?.name?.charAt(0) || conv.otherUser?.email?.charAt(0) || 'P'}
                        </div>
                        {conv.unreadCount > 0 && (
                          <div style="position: absolute; top: -2px; right: -2px; width: 20px; height: 20px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600;">
                            {conv.unreadCount}
                          </div>
                        )}
                        {conv.status === 'pending' && (
                          <div style="position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px; background-color: #f59e0b; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 10px;">⏳</span>
                          </div>
                        )}
                      </div>
                      <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                          <p style="font-weight: 600; color: #111827; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {conv.otherUser?.name || conv.otherUser?.email}
                          </p>
                          <span style="font-size: 12px; color: #6b7280;">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        {conv.status === 'pending' ? (
                          <p style="font-size: 13px; color: #f59e0b; margin: 0; font-weight: 500;">
                            ⏳ Waiting for acceptance...
                          </p>
                        ) : (
                          <p style="font-size: 14px; color: #6b7280; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {conv.lastMessage?.content || 'Start the conversation'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
        
        {/* Main Area */}
        <div style="flex: 1; display: flex; flex-direction: column; background-color: #f9fafb;">
          {showAstrologyForm.value ? (
            // Astrology Form
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px;">
              <div style="max-width: 600px; width: 100%; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 32px;">
                <h2 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">
                  Birth Details
                </h2>
                <p style="color: #6b7280; margin: 0 0 24px 0;">
                  Please provide your birth details for accurate consultation with {selectedPartner.value?.name || 'the partner'}
                </p>
                
                <div style="display: grid; gap: 16px;">
                  <div>
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={astrologyData.value.name}
                      onInput={(e) => astrologyData.value.name = e.target.value}
                      placeholder="Your full name"
                      style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                    />
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                      <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={astrologyData.value.dateOfBirth}
                        onInput={(e) => astrologyData.value.dateOfBirth = e.target.value}
                        style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                      />
                    </div>
                    
                    <div>
                      <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                        Time of Birth
                      </label>
                      <input
                        type="time"
                        value={astrologyData.value.timeOfBirth}
                        onInput={(e) => astrologyData.value.timeOfBirth = e.target.value}
                        style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                      Place of Birth
                    </label>
                    <input
                      type="text"
                      value={astrologyData.value.placeOfBirth}
                      onInput={(e) => astrologyData.value.placeOfBirth = e.target.value}
                      placeholder="City, State, Country"
                      style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                    />
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                      <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                        Gowthra (Optional)
                      </label>
                      <input
                        type="text"
                        value={astrologyData.value.gowthra}
                        onInput={(e) => astrologyData.value.gowthra = e.target.value}
                        placeholder="Your gowthra"
                        style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                      />
                    </div>
                    
                    <div>
                      <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                        Zodiac Sign (Optional)
                      </label>
                      <input
                        type="text"
                        value={astrologyData.value.zodiacSign}
                        onInput={(e) => astrologyData.value.zodiacSign = e.target.value}
                        placeholder="e.g., Aries"
                        style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                      />
                    </div>
                  </div>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                      <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                        Moon Sign (Optional)
                      </label>
                      <input
                        type="text"
                        value={astrologyData.value.moonSign}
                        onInput={(e) => astrologyData.value.moonSign = e.target.value}
                        placeholder="e.g., Cancer"
                        style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                      />
                    </div>
                    
                    <div>
                      <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                        Ascendant (Optional)
                      </label>
                      <input
                        type="text"
                        value={astrologyData.value.ascendant}
                        onInput={(e) => astrologyData.value.ascendant = e.target.value}
                        placeholder="e.g., Leo"
                        style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 6px;">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      value={astrologyData.value.additionalInfo}
                      onInput={(e) => astrologyData.value.additionalInfo = e.target.value}
                      placeholder="Any specific concerns or questions..."
                      rows="3"
                      style="width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;"
                    />
                  </div>
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                  <button
                    onClick={cancelConversationRequest}
                    style="flex: 1; padding: 12px; background-color: #f3f4f6; color: #374151; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createConversationRequest}
                    disabled={!astrologyData.value.name || !astrologyData.value.dateOfBirth}
                    style={`flex: 1; padding: 12px; background-color: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s; ${
                      !astrologyData.value.name || !astrologyData.value.dateOfBirth ? 'opacity: 0.5; cursor: not-allowed;' : ''
                    }`}
                    onMouseEnter={(e) => {
                      if (astrologyData.value.name && astrologyData.value.dateOfBirth) {
                        e.currentTarget.style.backgroundColor = '#4f46e5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (astrologyData.value.name && astrologyData.value.dateOfBirth) {
                        e.currentTarget.style.backgroundColor = '#6366f1';
                      }
                    }}
                  >
                    Send Consultation Request
                  </button>
                </div>
              </div>
            </div>
          ) : selectedConversation.value ? (
            // Chat Area
            <>
              {/* Chat Header */}
              <div style="padding: 16px 24px; background-color: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <button
                    onClick={backToPartnersList}
                    style="padding: 8px; background-color: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;"
                  >
                    <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                    {selectedConversation.value.otherUser?.name?.charAt(0) || selectedConversation.value.otherUser?.email?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p style="font-weight: 600; color: #111827; margin: 0;">
                      {selectedConversation.value.otherUser?.name || selectedConversation.value.otherUser?.email}
                    </p>
                    {selectedConversation.value.status === 'pending' ? (
                      <p style="font-size: 12px; color: #f59e0b; margin: 0;">⏳ Waiting for acceptance</p>
                    ) : isTyping.value ? (
                      <p style="font-size: 12px; color: #10b981; margin: 0;">typing...</p>
                    ) : (
                      <p style="font-size: 12px; color: #6b7280; margin: 0;">
                        {selectedConversation.value.otherUser?.specialization || 'Astrologer'}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={endConversation}
                  style="padding: 8px 16px; background-color: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                >
                  End Consultation
                </button>
              </div>
              
              {/* Messages */}
              <div 
                id="messages-container"
                style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px;"
              >
                {loading.value ? (
                  <div style="text-align: center; padding: 40px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; margin: 0 auto; animation: spin 1s linear infinite;" />
                  </div>
                ) : selectedConversation.value.status === 'pending' ? (
                  <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <div style="width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                      <span style="font-size: 32px;">⏳</span>
                    </div>
                    <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0; color: #111827;">
                      Waiting for Partner Acceptance
                    </p>
                    <p style="font-size: 14px; margin: 0;">
                      {selectedConversation.value.otherUser?.name || 'The partner'} will be notified of your consultation request.
                    </p>
                  </div>
                ) : messages.value.length === 0 ? (
                  <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.value.map((message, index) => {
                    const isUserMessage = message.senderModel === 'User';
                    const showDate = index === 0 || 
                      formatDate(messages.value[index - 1]?.createdAt) !== formatDate(message.createdAt);
                    
                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div style="text-align: center; margin: 16px 0;">
                            <span style="padding: 4px 12px; background-color: #e5e7eb; border-radius: 12px; font-size: 12px; color: #6b7280;">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        
                        <div style={`display: flex; ${isUserMessage ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}`}>
                          <div style={`max-width: 70%; padding: 12px 16px; border-radius: 16px; ${
                            isUserMessage
                              ? 'background-color: #6366f1; color: white; border-bottom-right-radius: 4px;'
                              : 'background-color: white; color: #111827; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);'
                          }`}>
                            <p style="margin: 0; word-wrap: break-word;">{message.content}</p>
                            <div style={`display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 11px; ${
                              isUserMessage ? 'color: rgba(255,255,255,0.7); justify-content: flex-end;' : 'color: #9ca3af;'
                            }`}>
                              <span>{formatTime(message.createdAt)}</span>
                              {isUserMessage && (
                                <span>
                                  {message.isRead ? '✓✓' : message.isDelivered ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Message Input */}
              <div style="padding: 16px 24px; background-color: white; border-top: 1px solid #e5e7eb;">
                {selectedConversation.value.status === 'pending' ? (
                  <div style="text-align: center; padding: 12px; background-color: #fef3c7; border-radius: 8px; color: #92400e; font-size: 14px;">
                    Please wait for the partner to accept your consultation request
                  </div>
                ) : (
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <input
                      type="text"
                      value={newMessage.value}
                      onInput={(e) => {
                        newMessage.value = e.target.value;
                        startTyping();
                      }}
                      onKeypress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      style="flex: 1; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 24px; outline: none; font-size: 14px;"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.value.trim()}
                      style={`padding: 12px 24px; background-color: #6366f1; color: white; border: none; border-radius: 24px; font-weight: 500; cursor: pointer; transition: background-color 0.2s; ${
                        !newMessage.value.trim() ? 'opacity: 0.5; cursor: not-allowed;' : ''
                      }`}
                      onMouseEnter={(e) => {
                        if (newMessage.value.trim()) {
                          e.currentTarget.style.backgroundColor = '#4f46e5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newMessage.value.trim()) {
                          e.currentTarget.style.backgroundColor = '#6366f1';
                        }
                      }}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Empty State
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #6b7280;">
              <div style="text-align: center;">
                <svg style="width: 64px; height: 64px; margin: 0 auto 16px; color: #d1d5db;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">Welcome to Spiritual Consultations</p>
                <p style="font-size: 14px; margin: 0 0 16px 0;">Select a partner or start a new consultation</p>
                <button
                  onClick={() => showPartnersList.value = true}
                  style="padding: 12px 24px; background-color: #6366f1; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;"
                >
                  Browse Partners
                </button>
              </div>
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
};