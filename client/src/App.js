import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://ai-chat-assistant.onrender.com');

function App() {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatContainerRef = useRef(null);

  const initialSuggestedQuestions = [
    "Show me pricing plans",
    "reset password",
    "refund policy"
  ];

  // Generate or retrieve session ID on component mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadConversation(storedSessionId);
    } else {
      generateNewSession();
    }
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Show chat if there are messages
  useEffect(() => {
    setShowChat(messages.length > 0);
  }, [messages]);

  const generateNewSession = () => {
    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);
    setMessages([]);
    setError('');
    setShowChat(false);
  };

  const loadConversation = async (sid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${sid}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        console.error('Failed to load conversation:', data.message);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setError('');
    setIsLoading(true);

    // Show chat immediately when user sends a message
    if (!showChat) {
      setShowChat(true);
    }

    // Add user message to UI immediately
    const tempUserMessage = {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add assistant response to messages
        const assistantMessage = {
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(data.message || 'Failed to send message');
        // Remove the temporary user message if request failed
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Network error. Please check your connection.');
      // Remove the temporary user message if request failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const handleNewChat = () => {
    generateNewSession();
  };

  return (
    <div className="app">
      <button className="new-chat-btn" onClick={handleNewChat}>
        New Chat
      </button>

      <div className="main-container">
        {!showChat && (
          <>
            <div className="header">
              <h1 className="title">Meet AI Mode</h1>
              <p className="subtitle">Ask detailed questions for better responses</p>
            </div>

            <div className="chat-container active" ref={chatContainerRef}>
              <div className="message assistant">
                <div className="message-avatar">
                  AI
                </div>
                <div>
                  <div className="message-content">
                    How can AI assistant help you?
                  </div>
                </div>
              </div>

              <div className="suggestions-bubbles">
                {initialSuggestedQuestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="suggestion-bubble"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>

            <div className="input-section">
              <div className="input-container">
                <input
                  type="text"
                  className="message-input"
                  placeholder="Ask anything"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <div className="input-icons">
                  <span className="input-icon">📷</span>
                  <span className="input-icon">📎</span>
                  <span className="input-icon">🎤</span>
                  <button 
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    ↑
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {showChat && (
          <div className="chat-container active" ref={chatContainerRef}>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-avatar">
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>
                <div>
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-timestamp">
                    {formatTimestamp(message.created_at)}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">
                  AI
                </div>
                <div className="loading">
                  <span>Thinking</span>
                  <div className="loading-dots">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showChat && (
          <div className="input-section">
            <div className="input-container">
              <input
                type="text"
                className="message-input"
                placeholder="Ask anything"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
              <div className="input-icons">
                <span className="input-icon">📷</span>
                <span className="input-icon">📎</span>
                <span className="input-icon">🎤</span>
                <button 
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  ↑
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
