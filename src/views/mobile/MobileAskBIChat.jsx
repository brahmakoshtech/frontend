import { ref, onMounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import avatarChatService from '../../services/avatarChatService.js';

export default {
  name: 'MobileAskBIChat',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const messages = ref([]);
    const newMessage = ref('');
    const loading = ref(false);
    const chatContainer = ref(null);
    const chatId = ref('new');
    const showHistoryPanel = ref(false);
    const chatHistory = ref([]);
    const isRecording = ref(false);
    const isTyping = ref(false);
    let typingTimeout = null;
    
    const avatarId = route.query.avatarId;
    const avatarName = route.query.name || 'AI Guide';
    const avatarImage = route.query.image;
    const agentId = route.query.agentId || 'agent_f401294bbade2806';

    const copiedMessageId = ref(null);

    const copyMessage = (text, messageId) => {
      navigator.clipboard.writeText(text).then(() => {
        copiedMessageId.value = messageId;
        setTimeout(() => {
          copiedMessageId.value = null;
        }, 2000);
      });
    };

    const scrollToBottom = () => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    };

    const startVoiceInput = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Voice input not supported in this browser');
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      
      recognition.onstart = () => {
        isRecording.value = true;
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        newMessage.value = transcript;
        isRecording.value = false;
      };
      
      recognition.onerror = () => {
        isRecording.value = false;
      };
      
      recognition.onend = () => {
        isRecording.value = false;
      };
      
      recognition.start();
    };

    const handleTyping = () => {
      isTyping.value = true;
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isTyping.value = false;
      }, 1000);
    };

    const formatMessage = (text) => {
      let decoded = text
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      decoded = decoded.replace(/```([\s\S]*?)```/g, (match, code) => {
        return `<pre style="background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0;"><code>${code.trim()}</code></pre>`;
      });
      
      decoded = decoded.replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');
      
      return decoded
        .replace(/^### (.*$)/gim, '<h3 style="margin: 0.75rem 0 0.5rem 0; font-size: 1rem; font-weight: 600; color: #1e293b;">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 style="margin: 0.75rem 0 0.5rem 0; font-size: 1.1rem; font-weight: 600; color: #1e293b;">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 style="margin: 1rem 0 0.5rem 0; font-size: 1.2rem; font-weight: 600; color: #1e293b;">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^\d+\. (.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
        .replace(/^- (.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.25rem;">$1</li>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #6366f1; text-decoration: underline;" target="_blank">$1</a>')
        .replace(/\n/g, '<br>');
    };

    const streamText = async (fullText, messageId) => {
      const words = fullText.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        const msgIndex = messages.value.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          messages.value[msgIndex].text = currentText;
        }
        
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      nextTick(() => scrollToBottom());
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim()) return;

      const userMsg = {
        id: Date.now(),
        text: newMessage.value,
        sender: 'user',
        timestamp: new Date()
      };

      messages.value.push(userMsg);
      const question = newMessage.value;
      newMessage.value = '';
      scrollToBottom();

      loading.value = true;

      try {
        const response = await avatarChatService.sendMessage(
          agentId,
          question,
          avatarName
        );

        if (response.success && response.data) {
          if (response.data.chatId) {
            chatId.value = response.data.chatId;
          }

          loading.value = false;

          const aiMsg = {
            id: Date.now() + 1,
            text: '',
            sender: 'ai',
            timestamp: new Date()
          };
          messages.value.push(aiMsg);

          await streamText(
            response.data.response || 'I apologize, I could not generate a response.',
            aiMsg.id
          );
          
          await fetchChatHistory();
        } else {
          const errorMsg = {
            id: Date.now() + 1,
            text: 'I apologize, I am having trouble connecting right now. Please try again.',
            sender: 'ai',
            timestamp: new Date()
          };
          messages.value.push(errorMsg);
        }
        scrollToBottom();
      } catch (error) {
        const errorMsg = {
          id: Date.now() + 1,
          text: 'I apologize, something went wrong. Please try again.',
          sender: 'ai',
          timestamp: new Date()
        };
        messages.value.push(errorMsg);
        scrollToBottom();
      } finally {
        loading.value = false;
      }
    };

    const fetchChatHistory = async () => {
      try {
        const token = localStorage.getItem('token_user');
        const allChats = await import('../../services/api.js').then(m => m.default.getChats(token));
        
        let chats = [];
        if (allChats.data?.success && allChats.data?.data?.chats) {
          chats = allChats.data.data.chats;
        }
        else if (allChats.data?.chats) {
          chats = allChats.data.chats;
        }
        
        const avatarChats = chats.filter(chat => 
          chat.title && chat.title.startsWith('Chat with')
        );
        
        chatHistory.value = avatarChats.map(chat => ({
          _id: chat.chatId,
          title: chat.title,
          updatedAt: chat.updatedAt,
          messageCount: chat.messageCount
        }));
      } catch (error) {
        // Silent error
      }
    };

    const startNewChat = () => {
      avatarChatService.resetChat();
      chatId.value = 'new';
      messages.value = [{
        id: 1,
        text: `Namaste! I am ${avatarName}. How can I guide you today?`,
        sender: 'ai',
        timestamp: new Date()
      }];
      showHistoryPanel.value = false;
      
      router.replace({
        path: '/mobile/user/askbi/chat',
        query: { avatarId, name: avatarName, image: avatarImage, agentId }
      });
    };

    const loadChat = async (chat) => {
      avatarChatService.setCurrentChatId(chat._id);
      chatId.value = chat._id;
      showHistoryPanel.value = false;
      
      const response = await avatarChatService.getChatHistory(chat._id);
      
      if (response.success && response.data?.messages) {
        messages.value = response.data.messages.map((msg, idx) => ({
          id: idx + 1,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.timestamp || Date.now())
        }));
        scrollToBottom();
      }
      
      router.replace({
        path: '/mobile/user/askbi/chat',
        query: { avatarId, name: avatarName, image: avatarImage, agentId, chatId: chat._id }
      });
    };

    const goBack = () => {
      avatarChatService.resetChat();
      router.push('/mobile/user/ask-bi');
    };

    const learnGeetaShlokas = () => {
      router.push('/mobile/user/geeta-shlokas');
    };

    onMounted(() => {
      const existingChatId = route.query.chatId;
      
      if (existingChatId) {
        avatarChatService.setCurrentChatId(existingChatId);
        chatId.value = existingChatId;
        
        avatarChatService.getChatHistory(existingChatId).then(response => {
          if (response.success && response.data?.messages) {
            messages.value = response.data.messages.map((msg, idx) => ({
              id: idx + 1,
              text: msg.content,
              sender: msg.role === 'user' ? 'user' : 'ai',
              timestamp: new Date(msg.timestamp || Date.now())
            }));
            nextTick(() => scrollToBottom());
          }
        });
      } else {
        avatarChatService.resetChat();
        messages.value.push({
          id: 1,
          text: `Namaste! I am ${avatarName}. How can I guide you today?`,
          sender: 'ai',
          timestamp: new Date()
        });
      }
      
      fetchChatHistory();
      nextTick(() => scrollToBottom());
    });

    watch(() => route.query.chatId, (newChatId) => {
      if (newChatId && newChatId !== chatId.value) {
        avatarChatService.setCurrentChatId(newChatId);
        chatId.value = newChatId;
        
        avatarChatService.getChatHistory(newChatId).then(response => {
          if (response.success && response.data?.messages) {
            messages.value = response.data.messages.map((msg, idx) => ({
              id: idx + 1,
              text: msg.content,
              sender: msg.role === 'user' ? 'user' : 'ai',
              timestamp: new Date(msg.timestamp || Date.now())
            }));
            scrollToBottom();
          }
        });
      }
    });

    return () => (
      <div style={{
        display: 'flex',
        height: '100vh',
        background: '#f8fafc',
        position: 'relative'
      }}>
        {showHistoryPanel.value && (
          <div style={{
            width: '280px',
            background: 'white',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Chat History</h3>
              <button
                onClick={() => showHistoryPanel.value = false}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >×</button>
            </div>
            <button
              onClick={startNewChat}
              style={{
                margin: '0.75rem',
                padding: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              + New Chat
            </button>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
              {chatHistory.value.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 1rem' }}>No chat history</p>
              ) : (
                chatHistory.value.map(chat => (
                  <div
                    key={chat._id}
                    onClick={() => loadChat(chat)}
                    style={{
                      padding: '0.75rem',
                      margin: '0.25rem 0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: chat._id === chatId.value ? '#f1f5f9' : 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.25rem' }}>
                      {chat.title || 'Chat'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
        }}>
          <button
            onClick={goBack}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ←
          </button>
          {avatarImage && (
            <img
              src={avatarImage}
              alt={avatarName}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white'
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{avatarName}</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>
              {loading.value ? `${avatarName} is typing...` : 'AI Spiritual Guide'}
            </p>
          </div>
          <button
            onClick={() => showHistoryPanel.value = !showHistoryPanel.value}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '50%',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
        </div>

        <div
          ref={chatContainer}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {messages.value.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                maxWidth: '75%',
                padding: '0.75rem 1rem',
                borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.sender === 'user' 
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'white',
                color: msg.sender === 'user' ? 'white' : '#1e293b',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                wordBreak: 'break-word'
              }}>
                <p 
                  style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}
                  innerHTML={formatMessage(msg.text)}
                ></p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <small style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </small>
                  {msg.sender === 'ai' && msg.text && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {copiedMessageId.value === msg.id && (
                        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: '500' }}>
                          Copied!
                        </span>
                      )}
                      <button
                        onClick={() => copyMessage(msg.text, msg.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          opacity: 0.6
                        }}
                        title="Copy message"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading.value && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '18px 18px 18px 4px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0s' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                  <span style={{ fontSize: '0.75rem', color: '#6366f1', marginLeft: '0.5rem' }}>{avatarName} is typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Learn Geeta Shlokas Button */}
        <div style={{
          padding: '0.5rem 1rem',
          background: 'white',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={learnGeetaShlokas}
            disabled={loading.value}
            style={{
              width: 'auto',
              padding: '0.625rem 1.25rem',
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              cursor: loading.value ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
              transition: 'all 0.2s ease',
              opacity: loading.value ? 0.6 : 1
            }}
            onMouseDown={(e) => !loading.value && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            📖 Learn Geeta Shlokas
          </button>
        </div>

        <div style={{
          padding: '1rem',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <button
            onClick={startVoiceInput}
            disabled={loading.value || isRecording.value}
            style={{
              background: isRecording.value ? '#ef4444' : '#f1f5f9',
              color: isRecording.value ? 'white' : '#64748b',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '50%',
              cursor: loading.value ? 'not-allowed' : 'pointer',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isRecording.value ? 'pulse 1.5s infinite' : 'none'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
              <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
          </button>
          <input
            type="text"
            value={newMessage.value}
            onInput={(e) => {
              newMessage.value = e.target.value;
              handleTyping();
            }}
            onKeypress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.value.trim() || loading.value}
            style={{
              background: newMessage.value.trim() && !loading.value 
                ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                : '#e2e8f0',
              color: newMessage.value.trim() && !loading.value ? 'white' : '#94a3b8',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '50%',
              cursor: newMessage.value.trim() && !loading.value ? 'pointer' : 'not-allowed',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}
          >
            ➤
          </button>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); } 
            40% { transform: scale(1); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
        `}</style>
      </div>
      </div>
    );
  }
};
