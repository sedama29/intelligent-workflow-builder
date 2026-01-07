import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import './ChatInterface.css';

function ChatInterface({ workflowId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await chatAPI.getHistory(sessionId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      message: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(workflowId, sessionId, inputMessage);
      const assistantMessage = {
        id: response.data.id,
        role: 'assistant',
        message: response.data.message,
        created_at: response.data.created_at,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now(),
        role: 'assistant',
        message: 'Error: ' + (error.response?.data?.detail || error.message),
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Chat with Workflow</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-chat">
            <p>Start a conversation by asking a question!</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {message.message}
            </div>
            <div className="message-time">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          rows="2"
          disabled={loading}
        />
        <button
          className="send-button"
          onClick={sendMessage}
          disabled={loading || !inputMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;

