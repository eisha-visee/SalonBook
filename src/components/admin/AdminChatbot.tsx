'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'model';
    message: string;
}

export default function AdminChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', message: 'Hello Admin! How can I help you manage the salon today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', message: userMessage }]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-5) // Send last 5 messages for context
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(`${data.error}: ${data.details || ''}`);
            }

            setMessages(prev => [...prev, { role: 'model', message: data.message }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', message: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="admin-chatbot-container">
                {/* Toggle Button */}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="chat-toggle-btn"
                    >
                        💬
                    </button>
                )}

                {/* Chat Window */}
                {isOpen && (
                    <div className="chat-window">
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-title">
                                <span>🤖</span> Admin Assistant
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="chat-close-btn"
                            >
                                ×
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`message ${msg.role}`}
                                >
                                    {msg.message}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="message model">
                                    <span className="typing-indicator">Thinking...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="chat-input-form">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a command..."
                                disabled={isLoading}
                                className="chat-input"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="chat-send-btn"
                            >
                                ➤
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <style jsx>{`
                .admin-chatbot-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                }

                .chat-toggle-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background-color: #FF69B4;
                    color: white;
                    border: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    transition: transform 0.2s;
                }

                .chat-toggle-btn:hover {
                    transform: scale(1.1);
                }

                .chat-window {
                    width: 350px;
                    height: 500px;
                    background-color: white;
                    border-radius: 16px;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    border: 1px solid #eee;
                    animation: slideUp 0.3s ease;
                }

                .chat-header {
                    padding: 16px;
                    background-color: #FF69B4;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .chat-title {
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .chat-close-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 24px;
                    padding: 0;
                    line-height: 1;
                }

                .chat-messages {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    background-color: #f9f9f9;
                }

                .message {
                    padding: 10px 14px;
                    border-radius: 12px;
                    max-width: 80%;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    font-size: 14px;
                    line-height: 1.4;
                    word-break: break-word;
                }

                .message.user {
                    align-self: flex-end;
                    background-color: #FF69B4;
                    color: white;
                    border-bottom-right-radius: 4px;
                }

                .message.model {
                    align-self: flex-start;
                    background-color: white;
                    color: #333;
                    border: 1px solid #eee;
                    border-bottom-left-radius: 4px;
                }

                .chat-input-form {
                    padding: 12px;
                    border-top: 1px solid #eee;
                    background-color: white;
                    display: flex;
                    gap: 8px;
                }

                .chat-input {
                    flex: 1;
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    outline: none;
                    font-size: 14px;
                }

                .chat-input:focus {
                    border-color: #FF69B4;
                }

                .chat-send-btn {
                    background-color: #FF69B4;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 0 16px;
                    cursor: pointer;
                    font-size: 16px;
                }

                .chat-send-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Mobile Responsiveness */
                @media (max-width: 480px) {
                    .admin-chatbot-container {
                        bottom: 0;
                        right: 0;
                        z-index: 10000;
                    }

                    .chat-toggle-btn {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                    }

                    .chat-window {
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        width: 100%;
                        height: 100%; /* Full screen on mobile */
                        max-height: 100%;
                        border-radius: 0;
                        border: none;
                    }

                    .chat-messages {
                        padding-bottom: 20px; 
                    }
                }
            `}</style>
        </>
    );
}
