'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/adminChatService';
import styles from './AdminChat.module.css';

interface AdminChatProps {
  onActionExecuted?: (result: any) => void;
}

export default function AdminChat({ onActionExecuted }: AdminChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! I\'m your admin assistant. You can tell me things like:\n- "Add new stylist Rahul joining today"\n- "Rahul is on leave, reassign his appointments"\n- "What was my revenue yesterday?"',
      timestamp: new Date(),
      actionData: { type: 'NONE', data: {}, requiresFollowUp: false, confidence: 0 }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [expectingFollowUp, setExpectingFollowUp] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputValue, conversationId })
      });

      const data = await response.json();

      // Update conversation ID from response
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        actionData: data.action,
        followUpQuestions: data.followUpQuestions
      };

      setMessages(prev => [...prev, assistantMessage]);
      setExpectingFollowUp(data.requiresFollowUp);

      // Notify parent about action execution
      if (data.actionResult?.success && onActionExecuted) {
        onActionExecuted(data.actionResult);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        actionData: { type: 'NONE', data: {}, requiresFollowUp: false, confidence: 0 }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <h2>Admin Assistant</h2>
        <p>AI-powered salon management</p>
      </div>

      <div className={styles.messagesContainer}>
        {messages.map(message => (
          <div
            key={message.id}
            className={`${styles.messageWrapper} ${styles[message.role]}`}
          >
            <div className={styles.message}>
              <p>{message.content}</p>

              {/* Display action data if available */}
              {message.actionData && message.actionData.type !== 'NONE' && message.role === 'assistant' && (
                <div className={styles.actionInfo}>
                  <small>
                    <strong>Intent:</strong> {message.actionData.type}
                  </small>
                </div>
              )}

              {/* Display follow-up questions if any */}
              {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                <div className={styles.followUpQuestions}>
                  <small>
                    <strong>Suggested follow-ups:</strong>
                  </small>
                  {message.followUpQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      className={styles.suggestionButton}
                      onClick={() => {
                        setInputValue(question);
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className={styles.timestamp}>
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}

        {loading && (
          <div className={`${styles.messageWrapper} ${styles.assistant}`}>
            <div className={styles.message}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.inputForm}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={
            expectingFollowUp
              ? 'Please provide the information...'
              : 'Tell me something... (e.g., "Add new stylist Rahul")'
          }
          disabled={loading}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className={styles.sendButton}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
