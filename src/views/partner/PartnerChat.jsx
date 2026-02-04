import { ref, onMounted, onUnmounted, computed } from 'vue';
import io from 'socket.io-client';
import api from '../../services/api.js';

export default {
  name: 'PartnerChat',
  setup() {
    // State
    const socket = ref(null);
    const isConnected = ref(false);
    const loading = ref(false);
    const activeTab = ref('conversations'); // 'conversations' or 'requests'
    
    // Data
    const conversations = ref([]);
    const pendingRequests = ref([]);
    const selectedConversation = ref(null);
    const messages = ref([]);
    const newMessage = ref('');
    const typingUsers = ref(new Set());
    const onlineStatuses = ref(new Map());
    
    // Partner info
    const partnerInfo = ref({
      id: null,
      status: 'online',
      activeConversations: 0,
      maxConversations: 5
    });
    
    // Typing timeout
    let typingTimeout = null;
    // Message poll interval when WebSocket is disconnected
    let messagePollInterval = null;
    
    // WebSocket Connection
    const connectWebSocket = () => {
      const token = localStorage.getItem('partner_token');
      
      if (!token) {
        console.error('❌ No partner token found');
        return;
      }
      
      console.log('🔌 Connecting to WebSocket...');
      console.log('🔑 Using token:', token.substring(0, 20) + '...');
      
      // Disconnect existing socket if any
      if (socket.value) {
        socket.value.disconnect();
      }
      
      socket.value = io(import.meta.env.VITE_WS_URL || 'https://stage.brahmakosh.com', {
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
          partnerInfo.value.id = data.userId;
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
        console.log('✅ Messages read by user:', data);
        
        if (data.messageIds === 'all') {
          messages.value.forEach(msg => {
            if (msg.senderModel === 'Partner') {
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
            typingUsers.value.add(data.userId);
          } else {
            typingUsers.value.delete(data.userId);
          }
        }
      });
      
      // Conversation events
      socket.value.on('conversation:user:joined', (data) => {
        console.log('👤 User joined conversation:', data);
      });
      
      socket.value.on('conversation:user:left', (data) => {
        console.log('👋 User left conversation:', data);
      });
      
      // New conversation request notification
      socket.value.on('notification:new:request', async (data) => {
        console.log('🔔 New conversation request:', data);
        await loadPendingRequests();
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('New Consultation Request', {
            body: `${data.userName || 'A user'} has requested a consultation`,
            icon: '/logo.png'
          });
        }
      });
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
    
    // Load pending requests
    const loadPendingRequests = async () => {
      try {
        console.log('🔍 Loading partner requests...');
        const response = await api.getPartnerRequests();
        
        console.log('📦 Full response:', response.data);
        
        // API returns { success, data: { requests, totalRequests } }
        if (response && response.success && response.data) {
          pendingRequests.value = response.data.requests || [];
          console.log('✅ Loaded pending requests:', pendingRequests.value.length);
        } else {
          pendingRequests.value = [];
          console.warn('⚠️ No requests data found in response');
        }
      } catch (error) {
        console.error('❌ Error loading requests:', error);
        pendingRequests.value = [];
      }
    };
    
    // Accept conversation request
    const acceptRequest = async (conversationId) => {
      try {
        const response = await api.acceptConversationRequest(conversationId);
        
        if (response && response.success) {
          console.log('✅ Request accepted');
          
          // Remove from pending requests
          pendingRequests.value = pendingRequests.value.filter(
            r => r.conversationId !== conversationId
          );
          
          // Add to conversations
          const conversation = response.data;
          conversations.value.unshift(conversation);
          
          // Switch to conversations tab
          activeTab.value = 'conversations';
          
          // Open the conversation
          selectConversation(conversation);
        }
      } catch (error) {
        console.error('❌ Error accepting request:', error);
        alert(error.response?.data?.message || 'Failed to accept request');
      }
    };
    
    // Reject conversation request
    const rejectRequest = async (conversationId) => {
      if (!confirm('Are you sure you want to reject this request?')) return;
      
      try {
        const response = await api.rejectConversationRequest(conversationId);
        
        if (response && response.success) {
          console.log('✅ Request rejected');
          pendingRequests.value = pendingRequests.value.filter(
            r => r.conversationId !== conversationId
          );
        }
      } catch (error) {
        console.error('❌ Error rejecting request:', error);
      }
    };
    
    // Select conversation
    const selectConversation = async (conversation) => {
      console.log('💬 Selecting conversation:', conversation);
      selectedConversation.value = conversation;
      messages.value = [];
      
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
        alert('Please accept the conversation request first');
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
      
      if (!confirm('Are you sure you want to end this conversation?')) return;
      
      try {
        await api.endConversation(selectedConversation.value.conversationId);
        
        console.log('✅ Conversation ended');
        
        // Remove from conversations list
        conversations.value = conversations.value.filter(
          c => c.conversationId !== selectedConversation.value.conversationId
        );
        
        selectedConversation.value = null;
        messages.value = [];
        
        if (messagePollInterval) {
          clearInterval(messagePollInterval);
          messagePollInterval = null;
        }
        
        // Reload conversations to update counts
        await loadConversations();
      } catch (error) {
        console.error('❌ Error ending conversation:', error);
      }
    };
    
    // Update partner status
    const updateStatus = async (status) => {
      try {
        await api.updatePartnerStatus(status);
        partnerInfo.value.status = status;
        console.log('✅ Status updated to:', status);
      } catch (error) {
        console.error('❌ Error updating status:', error);
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
    
    // Format full date for birth details
    const formatFullDate = (dateString) => {
      if (!dateString) return 'Not provided';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch (e) {
        return dateString;
      }
    };
    
    // Computed
    const isTyping = computed(() => typingUsers.value.size > 0);
    const unreadCount = computed(() => {
      return conversations.value.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    });
    
    // Request notification permission
    const requestNotificationPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };
    
    // Lifecycle
    onMounted(async () => {
      console.log('🚀 PartnerChat component mounted');
      
      // Request notification permission
      requestNotificationPermission();
      
      // Connect WebSocket first
      connectWebSocket();
      
      // Load data
      await loadConversations();
      await loadPendingRequests();
    });
    
    onUnmounted(() => {
      console.log('👋 PartnerChat component unmounting');
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
                Chat Sessions
              </h2>
              <div style={`width: 12px; height: 12px; border-radius: 50%; ${
                isConnected.value ? 'background-color: #10b981;' : 'background-color: #ef4444;'
              }`} title={isConnected.value ? 'Connected' : 'Disconnected'} />
            </div>
            
            {/* Status selector */}
            <div style="display: flex; gap: 8px;">
              <select 
                value={partnerInfo.value.status}
                onChange={(e) => updateStatus(e.target.value)}
                style="flex: 1; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; background-color: white; cursor: pointer;"
              >
                <option value="online">🟢 Online</option>
                <option value="busy">🟡 Busy</option>
                <option value="offline">⚫ Offline</option>
              </select>
            </div>
          </div>
          
          {/* Tabs */}
          <div style="display: flex; border-bottom: 1px solid #e5e7eb;">
            <button
              onClick={() => activeTab.value = 'conversations'}
              style={`flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-weight: 500; ${
                activeTab.value === 'conversations'
                  ? 'color: #6366f1; border-bottom: 2px solid #6366f1;'
                  : 'color: #6b7280;'
              }`}
            >
              Conversations
              {unreadCount.value > 0 && (
                <span style="margin-left: 8px; padding: 2px 6px; background-color: #ef4444; color: white; border-radius: 10px; font-size: 11px;">
                  {unreadCount.value}
                </span>
              )}
            </button>
            <button
              onClick={() => activeTab.value = 'requests'}
              style={`flex: 1; padding: 12px; border: none; background: none; cursor: pointer; font-weight: 500; ${
                activeTab.value === 'requests'
                  ? 'color: #6366f1; border-bottom: 2px solid #6366f1;'
                  : 'color: #6b7280;'
              }`}
            >
              Requests
              {pendingRequests.value.length > 0 && (
                <span style="margin-left: 8px; padding: 2px 6px; background-color: #f59e0b; color: white; border-radius: 10px; font-size: 11px;">
                  {pendingRequests.value.length}
                </span>
              )}
            </button>
          </div>
          
          {/* List */}
          <div style="flex: 1; overflow-y: auto;">
            {activeTab.value === 'conversations' ? (
              conversations.value.length === 0 ? (
                <div style="padding: 40px 20px; text-align: center; color: #6b7280;">
                  <svg style="width: 48px; height: 48px; margin: 0 auto 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p>No active conversations</p>
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
                          {conv.otherUser?.profile?.name?.charAt(0) || conv.otherUser?.email?.charAt(0) || 'U'}
                        </div>
                        {conv.unreadCount > 0 && (
                          <div style="position: absolute; top: -2px; right: -2px; width: 20px; height: 20px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 600;">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                      <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                          <p style="font-weight: 600; color: #111827; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {conv.otherUser?.profile?.name || conv.otherUser?.email}
                          </p>
                          <span style="font-size: 12px; color: #6b7280;">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p style="font-size: 14px; color: #6b7280; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              pendingRequests.value.length === 0 ? (
                <div style="padding: 40px 20px; text-align: center; color: #6b7280;">
                  <svg style="width: 48px; height: 48px; margin: 0 auto 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No pending requests</p>
                </div>
              ) : (
                pendingRequests.value.map(request => (
                  <div
                    key={request.conversationId}
                    style="padding: 16px; border-bottom: 1px solid #f3f4f6; background-color: #fffbeb;"
                  >
                    <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
                      <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                        {request.userId?.profile?.name?.charAt(0) || request.userId?.email?.charAt(0) || 'U'}
                      </div>
                      <div style="flex: 1;">
                        <p style="font-weight: 600; color: #111827; margin: 0 0 4px 0;">
                          {request.userId?.profile?.name || request.userId?.email}
                        </p>
                        <p style="font-size: 12px; color: #6b7280; margin: 0;">
                          Requested {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Enhanced User Astrology Data Display */}
                    {request.userAstrologyData && (
                      <div style="background-color: white; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; border-left: 3px solid #6366f1;">
                        <p style="font-weight: 600; margin: 0 0 12px 0; color: #111827; display: flex; align-items: center; gap: 6px;">
                          <span>🌟</span>
                          <span>Birth Details</span>
                        </p>
                        
                        <div style="display: grid; gap: 8px;">
                          {request.userAstrologyData.name && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">Name:</span>
                              <span style="color: #111827; font-weight: 500;">{request.userAstrologyData.name}</span>
                            </div>
                          )}
                          
                          {request.userAstrologyData.dateOfBirth && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">DOB:</span>
                              <span style="color: #111827; font-weight: 500;">{formatFullDate(request.userAstrologyData.dateOfBirth)}</span>
                            </div>
                          )}
                          
                          {request.userAstrologyData.timeOfBirth && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">Time:</span>
                              <span style="color: #111827; font-weight: 500;">{request.userAstrologyData.timeOfBirth}</span>
                            </div>
                          )}
                          
                          {request.userAstrologyData.placeOfBirth && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">Place:</span>
                              <span style="color: #111827; font-weight: 500;">{request.userAstrologyData.placeOfBirth}</span>
                            </div>
                          )}
                          
                          {request.userAstrologyData.gowthra && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">Gowthra:</span>
                              <span style="color: #111827; font-weight: 500;">{request.userAstrologyData.gowthra}</span>
                            </div>
                          )}
                          
                          {request.userAstrologyData.zodiacSign && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">Zodiac:</span>
                              <span style="color: #111827; font-weight: 500;">{request.userAstrologyData.zodiacSign}</span>
                            </div>
                          )}
                          
                          {request.userAstrologyData.moonSign && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">Moon Sign:</span>
                              <span style="color: #111827; font-weight: 500;">{request.userAstrologyData.moonSign}</span>
                            </div>
                          )}
                          
                          {request.userAstrologyData.ascendant && (
                            <div style="display: flex; gap: 8px;">
                              <span style="color: #6b7280; min-width: 70px;">Ascendant:</span>
                              <span style="color: #111827; font-weight: 500;">{request.userAstrologyData.ascendant}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* If no astrology data */}
                    {!request.userAstrologyData && (
                      <div style="background-color: #fef3c7; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 13px; color: #92400e;">
                        <p style="margin: 0;">⚠️ No birth details provided</p>
                      </div>
                    )}
                    
                    <div style="display: flex; gap: 8px;">
                      <button
                        onClick={() => acceptRequest(request.conversationId)}
                        style="flex: 1; padding: 10px; background-color: #10b981; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(request.conversationId)}
                        style="flex: 1; padding: 10px; background-color: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
        
        {/* Chat Area */}
        <div style="flex: 1; display: flex; flex-direction: column; background-color: #f9fafb;">
          {selectedConversation.value ? (
            <>
              {/* Chat Header */}
              <div style="padding: 16px 24px; background-color: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">
                    {selectedConversation.value.otherUser?.profile?.name?.charAt(0) || selectedConversation.value.otherUser?.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p style="font-weight: 600; color: #111827; margin: 0;">
                      {selectedConversation.value.otherUser?.profile?.name || selectedConversation.value.otherUser?.email}
                    </p>
                    {isTyping.value && (
                      <p style="font-size: 12px; color: #10b981; margin: 0;">typing...</p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={endConversation}
                  style="padding: 8px 16px; background-color: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                >
                  End Session
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
                ) : messages.value.length === 0 ? (
                  <div style="text-align: center; padding: 40px; color: #6b7280;">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.value.map((message, index) => {
                    const isPartnerMessage = message.senderModel === 'Partner';
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
                        
                        <div style={`display: flex; ${isPartnerMessage ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}`}>
                          <div style={`max-width: 70%; padding: 12px 16px; border-radius: 16px; ${
                            isPartnerMessage
                              ? 'background-color: #6366f1; color: white; border-bottom-right-radius: 4px;'
                              : 'background-color: white; color: #111827; border-bottom-left-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);'
                          }`}>
                            <p style="margin: 0; word-wrap: break-word;">{message.content}</p>
                            <div style={`display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 11px; ${
                              isPartnerMessage ? 'color: rgba(255,255,255,0.7); justify-content: flex-end;' : 'color: #9ca3af;'
                            }`}>
                              <span>{formatTime(message.createdAt)}</span>
                              {isPartnerMessage && (
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
                    Please accept the conversation request to enable messaging
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
            <div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #6b7280;">
              <div style="text-align: center;">
                <svg style="width: 64px; height: 64px; margin: 0 auto 16px; color: #d1d5db;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p style="font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">No conversation selected</p>
                <p style="font-size: 14px;">Select a conversation or accept a request to start chatting</p>
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