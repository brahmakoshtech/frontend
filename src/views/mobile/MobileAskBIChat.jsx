import { ref, onMounted, nextTick } from 'vue';
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
    
    const avatarId = route.query.avatarId;
    const avatarName = route.query.name || 'AI Guide';
    const avatarImage = route.query.image;
    const agentId = route.query.agentId || 'agent_f401294bbade2806';

    const scrollToBottom = () => {
      nextTick(() => {
        if (chatContainer.value) {
          chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
        }
      });
    };

    const formatMessage = (text) => {
      // Decode HTML entities and convert markdown to HTML
      const decoded = text
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      
      return decoded
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/\n/g, '<br>'); // Line breaks
    };

    const streamText = async (fullText, messageId) => {
      const words = fullText.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        // Update message text
        const msgIndex = messages.value.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
          messages.value[msgIndex].text = currentText;
        }
        
        scrollToBottom();
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay per word
      }
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

      // Show typing indicator
      loading.value = true;

      try {
        // Call backend avatar chat API with user context
        const response = await avatarChatService.sendMessage(
          agentId,
          question,
          avatarName
        );

        if (response.success && response.data) {
          // Update chatId for subsequent messages
          if (response.data.chatId) {
            chatId.value = response.data.chatId;
          }

          // Hide typing indicator
          loading.value = false;

          // Create AI message with empty text
          const aiMsg = {
            id: Date.now() + 1,
            text: '',
            sender: 'ai',
            timestamp: new Date()
          };
          messages.value.push(aiMsg);

          // Stream the response word by word
          await streamText(
            response.data.response || 'I apologize, I could not generate a response.',
            aiMsg.id
          );
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
        console.error('Error sending message:', error);
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

    const goBack = () => {
      // Reset chat when leaving
      avatarChatService.resetChat();
      router.push('/mobile/user/ask-bi');
    };

    onMounted(() => {
      // Reset chat on mount for fresh conversation
      avatarChatService.resetChat();
      // Welcome message
      messages.value.push({
        id: 1,
        text: `Namaste! I am ${avatarName}. How can I guide you today?`,
        sender: 'ai',
        timestamp: new Date()
      });
      scrollToBottom();
    });

    return () => (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#f8fafc'
      }}>
        {/* Header */}
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
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>AI Spiritual Guide</p>
          </div>
        </div>

        {/* Chat Messages */}
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
              <div
                style={{
                  maxWidth: '75%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender === 'user' 
                    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                    : 'white',
                  color: msg.sender === 'user' ? 'white' : '#1e293b',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  wordBreak: 'break-word'
                }}
              >
                <p 
                  style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}
                  innerHTML={formatMessage(msg.text)}
                ></p>
                <small style={{ 
                  fontSize: '0.7rem', 
                  opacity: 0.7,
                  display: 'block',
                  marginTop: '0.25rem'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </small>
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
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#6366f1',
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0s'
                  }}></span>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#6366f1',
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0.2s'
                  }}></span>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#6366f1',
                    animation: 'bounce 1.4s infinite ease-in-out both',
                    animationDelay: '0.4s'
                  }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{
          padding: '1rem',
          background: 'white',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={newMessage.value}
            onInput={(e) => newMessage.value = e.target.value}
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
            0%, 80%, 100% { 
              transform: scale(0);
            } 
            40% { 
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }
};
