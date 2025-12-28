import React, { useEffect, useState } from 'react';
import { Clock, MessageSquare, Trash2, X, ChevronRight } from 'lucide-react';
import { Card } from './Card';
import aiService from '../services/aiService';
import './ConversationHistory.css';

interface ConversationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: any) => void;
  currentUserId: string;
}

export function ConversationHistory({ isOpen, onClose, onSelectConversation, currentUserId }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await aiService.getAllConversations(currentUserId);
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, _conversationId: string) => { // In a real app we'd need ID, here we clear all for demo or need better API
    e.stopPropagation();
    if (confirm('Are you sure you want to clear your conversation history?')) {
        await aiService.clearHistory(currentUserId);
        loadConversations();
    }
  };

  return (
    <div className={`conversation-history-panel ${isOpen ? 'open' : ''}`}>
      <div className="history-header">
        <h3>
          <Clock size={20} />
          History
        </h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={40} />
            <p>No conversation history yet</p>
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map((group, index) => (
              <div key={index} className="date-group">
                <h4 className="date-header">{new Date(group.date).toLocaleDateString()}</h4>
                <Card 
                  className="history-item"
                  onClick={() => onSelectConversation(group)}
                >
                  <div className="history-item-content">
                    <span className="message-count">{group.messageCount} messages</span>
                    <p className="preview-text">{group.preview.substring(0, 60)}...</p>
                    <span className="time-text">
                      {new Date(group.lastMessage).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <ChevronRight size={16} className="arrow-icon" />
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {conversations.length > 0 && (
        <div className="history-footer">
            <button className="clear-history-btn" onClick={(e) => handleDelete(e, 'all')}>
                <Trash2 size={16} />
                Clear History
            </button>
        </div>
      )}
    </div>
  );
}
