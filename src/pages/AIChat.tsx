import { useState, useRef, useEffect } from 'react';
import { Card } from '../components/Card';
import { Send, Sparkles, TrendingUp, Calculator, FileText, DollarSign, Mic, MicOff, Volume2, VolumeX, Bell, History, Paperclip, X } from 'lucide-react';
import aiService from '../services/aiService';
import api from '../lib/api';
import { ConversationHistory } from '../components/ConversationHistory';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import './AIChat.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  image?: string; // base64 image data
}

export function AIChat() {
  const { user } = useAuth();
  const userId = user?.id;
  const { refreshTransactions, metrics } = useTransactions();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ name: string, summary: string, content: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const suggestedPrompts = [
    { icon: Calculator, text: "Explain double-entry bookkeeping", category: "Fundamentals" },
    { icon: TrendingUp, text: "Analyze current cash flow", category: "Analysis" },
    { icon: FileText, text: "Draft an audit report", category: "Reporting" },
    { icon: DollarSign, text: "Check for tax deductions", category: "Tax" },
  ];

  useEffect(() => {
    if (userId) {
      loadHistory();
      startProactiveMonitoring();
    }
  }, [userId]);

  const loadHistory = async () => {
    if (!userId) return;
    try {
      const history = await aiService.getHistory(userId);
      if (history && history.length > 0) {
        const formattedMessages: Message[] = history.map((msg: any, index: number) => ({
          id: msg.id || Date.now() + index, // Use DB id if available, fallback to unique timestamp
          text: msg.parts,
          sender: msg.role === 'model' ? 'ai' : 'user',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
        }));
        setMessages(formattedMessages);
      } else {
        // Welcome message if no history
        const welcomeMessage: Message = {
          id: Date.now(),
          text: `Hello! I'm your AI Accountant with real-time access to your organization's data. I can see that your current revenue is $${metrics.revenue.toLocaleString()} and expenses are $${metrics.expenses.toLocaleString()}. I am a smart CFO and can help with taxes, audits, and financial planning. What would you like to know?`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  // Auto-speak AI responses when voice is enabled
  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai' && !isTyping) {
        speakMessage(lastMessage.text);
      }
    }
  }, [messages, voiceEnabled, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice Input (Speech-to-Text)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setTimeout(() => handleSendMessage(), 500);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Voice Output (Text-to-Speech)
  const speakMessage = (text: string) => {
    // Remove markdown and special characters for cleaner speech
    const cleanText = text.replace(/[*_#`]/g, '').replace(/\n/g, '. ');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    
    // Use a professional voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha'));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    speechSynthesis.speak(utterance);
  };

  // Notification System
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } else if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  };

  const sendNotification = (title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        tag: 'audit-ai',
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Handle Document Upload (CSV/Excel)
    if (file.name.match(/\.(csv|xlsx|xls)$/)) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/documents/analyze', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const result = response.data;

        if (result.success) {
          const { imported = 0, skipped = 0, errors = [] } = result.data;
          
          // Build success message
          let message = `📄 Successfully uploaded: ${result.data.filename}\n`;
          message += `✅ Imported ${imported} transactions automatically!\n\n`;
          if (skipped > 0) {
            message += `⚠️ Skipped ${skipped} rows (invalid data)\n`;
          }
          if (errors.length > 0) {
            message += `\nErrors: ${errors.join(', ')}`;
          }
          message += `\n💡 Check the Transactions page to see your imported data!`;
          
          // Add a system message to chat
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: message,
            sender: 'ai',
            timestamp: new Date()
          }]);

          // Refresh transactions to show new data
          if (imported > 0) {
            refreshTransactions();
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to analyze document');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  // Proactive Monitoring
  const startProactiveMonitoring = () => {
    // Check for alerts every 30 seconds
    const monitoringInterval = setInterval(() => {
      // Low profit alert (example)
      if (metrics.profit < 0) {
        sendNotification(
          '⚠️ Profit Alert',
          `Current profit is negative ($${metrics.profit.toLocaleString()}). Review expenses.`
        );
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(monitoringInterval);
  };



  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage && !selectedDocument) || !userId) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue || (selectedImage ? '📎 Uploaded image' : '') || (selectedDocument ? `📎 Analyzed ${selectedDocument.name}` : ''),
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined,
    };

    const currentInput = inputValue;
    const currentImage = selectedImage;
    const aiMessageId = Date.now() + 1; // Unique ID for AI message

    // Optimistically update messages
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsTyping(true);

    // Create a placeholder AI message that will be updated with streaming content
    const aiMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, aiMessage]);

    // If image was sent, analyze it first
    if (currentImage) {
      try {
        const result = await aiService.analyzeImage(currentImage, userId);
        
        if (result.success) {
          const { amount, vendor, date, category, description, confidence } = result.data;
          const analysisText = `📊 **Receipt Analysis**\n\n` +
            `💰 Amount: $${amount.toFixed(2)}\n` +
            `🏪 Vendor: ${vendor}\n` +
            `📅 Date: ${date}\n` +
            `📁 Category: ${category}\n` +
            `📝 Description: ${description}\n` +
            `✅ Confidence: ${(confidence * 100).toFixed(0)}%\n\n` +
            `Would you like me to create a transaction from this receipt?`;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: analysisText }
                : msg
            )
          );
          setIsTyping(false);
          return;
        }
      } catch (error) {
        console.error('Image analysis error:', error);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, text: '❌ Failed to analyze image. Please try again.' }
              : msg
          )
        );
        setIsTyping(false);
        return;
      }
    }

    // Stream AI response from OpenAI backend
    let streamedText = '';
    
    try {
      // Prepare context including document content if available
      const financialContext: any = {
          financial: {
              cashBalance: metrics.profit, // Approximation
              revenue: { current: metrics.revenue, change: 0 },
              expenses: { current: metrics.expenses, change: 0 },
              profit: metrics.profit,
              profitMargin: metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0
          },
          transactions: {
              total: 0, // Not available in metrics
              pending: 0,
              flagged: 0,
              recent: [] // Backend will fetch this
          },
          compliance: {
              score: 100,
              pendingItems: 0,
              upcomingDeadlines: 0
          }
      };
      
      if (selectedDocument) {
        financialContext.documentAnalysis = {
          filename: selectedDocument.name,
          content: selectedDocument.content
        };
      }

      await aiService.streamChat({
        message: currentInput,
        userId: userId,
        financialContext,
        onChunk: (chunk: string) => {
          streamedText += chunk;
          // Update the AI message with streaming content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: streamedText }
                : msg
            )
          );
        },
        onComplete: async () => {
          setIsTyping(false);
          // Refresh transactions after AI response is complete
          await refreshTransactions();
        },
        onError: (error: Error) => {
          console.error('Streaming error:', error);
          const errorMessage = `❌ Connection Error: ${error.message}\n\nPlease check the backend console for details.`;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: errorMessage }
                : msg
            )
          );
          setIsTyping(false);
        },
      });
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
    }
  };

  const handlePromptClick = (promptText: string) => {
    setInputValue(promptText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectConversation = (_conversation: any) => {
    setHistoryOpen(false);
    // Reload history or specific conversation if supported
  };

  return (
    <div className="ai-chat">
      <ConversationHistory 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)}
        onSelectConversation={handleSelectConversation}
        currentUserId={user?.id || ''}
      />

      <header className="chat-header">
        <div className="header-content">
          <div className="ai-avatar">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2>Audit AI Accountant</h2>
              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-500/20">Super-Powered</span>
            </div>
            <p className="text-secondary">Connected to organization data • Strategic CFO Mode</p>
          </div>
        </div>
        <div className="header-controls">
          <button 
            className={`control-btn ${historyOpen ? 'active' : ''}`}
            onClick={() => setHistoryOpen(!historyOpen)}
            title="View conversation history"
          >
            <History size={20} />
          </button>
          <button 
            className={`control-btn ${voiceEnabled ? 'active' : ''}`}
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            title={voiceEnabled ? 'Disable voice output' : 'Enable voice output'}
          >
            {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            className={`control-btn ${notificationsEnabled ? 'active' : ''}`}
            onClick={requestNotificationPermission}
            title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
          >
            <Bell size={20} />
          </button>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </div>
      </header>

      {messages.length === 1 && (
        <section className="suggested-prompts">
          <h3>Suggested Topics</h3>
          <div className="prompts-grid">
            {suggestedPrompts.map((prompt, index) => (
              <div key={index} className="prompt-card-wrapper" onClick={() => handlePromptClick(prompt.text)}>
                <Card className="prompt-card hover-lift">
                  <div className="prompt-icon">
                    <prompt.icon size={20} />
                  </div>
                  <div className="prompt-content">
                    <span className="prompt-category">{prompt.category}</span>
                    <p>{prompt.text}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="chat-container">
        <div className="messages-area">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}`}>
              {message.sender === 'ai' && (
                <div className="message-avatar ai">
                  <Sparkles size={18} />
                </div>
              )}
              <div className="message-content">
                {message.image && (
                  <div className="message-image">
                    <img src={message.image} alt="Uploaded" />
                  </div>
                )}
                <div className="message-bubble">
                  {message.text}
                </div>
                <span className="message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.sender === 'user' && (
                <div className="message-avatar user">
                  <span>You</span>
                </div>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="message ai">
              <div className="message-avatar ai">
                <Sparkles size={18} />
              </div>
              <div className="message-content">
                <div className="message-bubble typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          {(selectedImage || selectedDocument) && (
            <div className="image-preview">
              {selectedImage && <img src={selectedImage} alt="Upload preview" />}
              {selectedDocument && (
                <div className="document-preview">
                  <span className="doc-icon">📄</span>
                  <span className="doc-name">{selectedDocument.name}</span>
                </div>
              )}
              <button className="remove-image" onClick={() => { setSelectedImage(null); setSelectedDocument(null); }}>
                <X size={16} />
              </button>
            </div>
          )}
          <Card className="input-card">
            <button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <button
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload image or document"
              disabled={isUploading}
            >
              {isUploading ? <div className="spinner-small"></div> : <Paperclip size={20} />}
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about accounting, finance, taxes, auditing..."
              rows={1}
            />
            <button 
              className="send-button" 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() && !selectedImage && !selectedDocument}
            >
              <Send size={20} />
            </button>
          </Card>
          <p className="input-hint">
            <Sparkles size={14} />
            {voiceEnabled ? 'Voice mode active - I\'ll speak my responses' : 'Powered by world-class AI trained on comprehensive accounting knowledge'}
          </p>
        </div>
      </div>
    </div>
  );
}
