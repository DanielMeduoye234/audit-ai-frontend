// Frontend API Service for AI Chat
import api from '../lib/api';

export interface StreamChatOptions {
  message: string;
  userId: string;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  financialContext?: any;
}

export interface ChatOptions {
  message: string;
  userId: string;
  financialContext?: any;
}

class AIService {
  /**
   * Stream AI response in real-time (like ChatGPT)
   */
  async streamChat(options: StreamChatOptions): Promise<void> {
    const { message, userId, onChunk, onComplete, onError, financialContext } = options;

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
          financialContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) throw new Error('Response body is null');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === 'data: [DONE]') {
            onComplete();
            return;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) onChunk(data.chunk);
            } catch (e) { /* ignore */ }
          }
        }
      }
      onComplete();
    } catch (error: any) {
      console.error('AIService Stream Error:', error);
      onError(error);
    }
  }

  async chat(options: ChatOptions): Promise<string> {
    const { message, userId, financialContext } = options;
    try {
      const response = await api.post('/ai/chat', {
        message,
        userId,
        financialContext
      });
      return response.data.response;
    } catch (error) {
      throw new Error(`Failed to get AI response: ${error}`);
    }
  }

  /**
   * Clear conversation history
   */
  async clearHistory(userId: string): Promise<void> {
    try {
      await api.delete(`/ai/history/${userId}`);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  async getHistory(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/ai/history/${userId}`);
      return response.data.history || [];
    } catch (error: any) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  async getAllConversations(userId: string): Promise<any[]> {
    try {
      const response = await api.get(`/ai/conversations/${userId}`);
      return response.data.conversations || [];
    } catch (error) {
      console.error('Failed to get all conversations:', error);
      return [];
    }
  }
  
  /**
   * Analyze image
   */
  async analyzeImage(image: string, userId: string): Promise<any> {
    try {
      const response = await api.post('/ai/analyze-image', {
        image,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Failed to analyze image:', error);
      throw error;
    }
  }
}

export default new AIService();
