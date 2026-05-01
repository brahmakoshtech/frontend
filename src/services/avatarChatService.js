import api from './api.js';

class AvatarChatService {
  constructor() {
    this.currentChatId = null;
  }

  async getChatHistory(chatId) {
    try {
      const token = localStorage.getItem('token_user');
      if (!token) throw new Error('User not authenticated');
      
      const response = await api.getChat(chatId, token);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async sendMessage(agentId, message, avatarName = 'AI Guide', liveAvatarId = null) {
    try {
      const token = localStorage.getItem('token_user');
      if (!token) {
        throw new Error('User not authenticated');
      }

      // Create new chat if no current chat
      if (!this.currentChatId) {
        const createResponse = await api.createChat(token);
        this.currentChatId = createResponse.data?.chatId;
      }

      // Send message to avatar chat endpoint with user context
      const response = await api.post(
        `/mobile/avatar-chat/${this.currentChatId}/message`,
        { message, avatarName, liveAvatarId },
        { token }
      );

      return {
        success: true,
        data: {
          response: response.data?.data?.assistantMessage?.content || response.data?.data?.response || 'No response',
          chatId: response.data?.data?.chatId || this.currentChatId,
          remainingBalance: response.data?.data?.remainingBalance,
          creditsDeducted: response.data?.data?.creditsDeducted
        }
      };
    } catch (error) {
      // Handle insufficient credits (402)
      if (error.response?.status === 402) {
        return {
          success: false,
          insufficientCredits: true,
          remainingBalance: error.response?.data?.remainingBalance ?? 0,
          message: 'Insufficient credits'
        };
      }
      this.currentChatId = null;
      return {
        success: false,
        message: error.message || 'Failed to send message'
      };
    }
  }

  setCurrentChatId(chatId) {
    this.currentChatId = chatId;
  }

  getCurrentChatId() {
    return this.currentChatId;
  }

  resetChat() {
    this.currentChatId = null;
  }
}

export default new AvatarChatService();
