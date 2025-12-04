'use client';

import { useState } from 'react';
import VoiceBooking from '@/components/VoiceBooking';

export default function ContactPage() {
    const [isCallActive, setIsCallActive] = useState(false);

    const handleCallClick = () => {
        // This will initiate the phone call
        window.location.href = 'tel:+919876543210';
    };

    const handleAICallClick = () => {
        // Open AI voice assistant modal
        setIsCallActive(true);
    };

    return (
        <>
            <VoiceBooking
                isOpen={isCallActive}
                onClose={() => setIsCallActive(false)}
            />
            <div className="contact-page">
                {/* Hero Section */}
                <section className="contact-hero">
                    <div className="contact-hero-content">
                        <div className="ai-badge">
                            <span className="ai-badge-icon">🤖</span>
                            <span>AI-Powered Booking</span>
                        </div>
                        <h1>Book Your Appointment<br />with Our AI Assistant</h1>
                        <p className="contact-hero-subtitle">
                            Experience the future of salon booking. Our AI assistant is available 24/7
                            to help you schedule appointments, answer questions, and provide personalized recommendations.
                        </p>

                        {/* Main Call Button */}
                        <button
                            className={`ai-call-button ${isCallActive ? 'active' : ''}`}
                            onClick={handleAICallClick}
                        >
                            <span className="call-icon">📞</span>
                            <span className="call-button-text">{isCallActive ? 'Connecting...' : 'Call AI Assistant'}</span>
                            <span className="call-button-pulse"></span>
                        </button>

                        <p className="contact-availability">
                            <span className="status-indicator"></span>
                            AI Assistant available 24/7 • Average wait time: 5 seconds
                        </p>
                    </div>

                    <div className="contact-hero-visual">
                        <div className="ai-assistant-card">
                            <div className="ai-avatar">
                                <div className="ai-avatar-inner">
                                    <span className="ai-avatar-emoji">🎙️</span>
                                </div>
                                <div className="ai-pulse-ring"></div>
                                <div className="ai-pulse-ring delay"></div>
                            </div>
                            <h3>Sophia AI</h3>
                            <p>Your Personal Booking Assistant</p>
                            <div className="ai-stats">
                                <div className="ai-stat">
                                    <span className="ai-stat-value">10k+</span>
                                    <span className="ai-stat-label">Bookings</span>
                                </div>
                                <div className="ai-stat">
                                    <span className="ai-stat-value">4.9</span>
                                    <span className="ai-stat-label">Rating</span>
                                </div>
                                <div className="ai-stat">
                                    <span className="ai-stat-value">24/7</span>
                                    <span className="ai-stat-label">Available</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="how-it-works">
                    <h2>How AI Booking Works</h2>
                    <p className="section-subtitle">Simple, fast, and intelligent</p>

                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">📞</div>
                            <h3>Call the Number</h3>
                            <p>Click the button above or dial +91 98765 43210 to connect with Sophia AI instantly.</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">🗣️</div>
                            <h3>Speak Naturally</h3>
                            <p>Tell Sophia what service you need, your preferred date, time, and location. Just talk normally!</p>
                        </div>

                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">✅</div>
                            <h3>Get Confirmed</h3>
                            <p>Sophia will find available slots, book your appointment, and send you a confirmation via SMS & Email.</p>
                        </div>
                    </div>
                </section>

                {/* AI Capabilities */}
                <section className="ai-capabilities">
                    <h2>What Sophia Can Do</h2>
                    <div className="capabilities-grid">
                        <div className="capability-card">
                            <span className="capability-icon">📅</span>
                            <h3>Schedule Appointments</h3>
                            <p>Book, reschedule, or cancel appointments in seconds</p>
                        </div>

                        <div className="capability-card">
                            <span className="capability-icon">💇</span>
                            <h3>Service Recommendations</h3>
                            <p>Get personalized service suggestions based on your needs</p>
                        </div>

                        <div className="capability-card">
                            <span className="capability-icon">📍</span>
                            <h3>Find Nearby Salons</h3>
                            <p>Discover salons near you with real-time availability</p>
                        </div>

                        <div className="capability-card">
                            <span className="capability-icon">💰</span>
                            <h3>Pricing Information</h3>
                            <p>Get instant quotes and compare service prices</p>
                        </div>

                        <div className="capability-card">
                            <span className="capability-icon">⭐</span>
                            <h3>Reviews & Ratings</h3>
                            <p>Hear about top-rated salons and stylists</p>
                        </div>

                        <div className="capability-card">
                            <span className="capability-icon">🔔</span>
                            <h3>Reminders & Updates</h3>
                            <p>Receive booking confirmations and reminders</p>
                        </div>
                    </div>
                </section>

                {/* Contact Information */}
                <section className="contact-info-section">
                    <div className="contact-info-grid">
                        <div className="contact-info-card">
                            <div className="contact-info-icon">📞</div>
                            <h3>Call AI Assistant</h3>
                            <p className="contact-info-value">Sophia AI</p>
                            <p className="contact-info-desc">Available 24/7 for bookings</p>
                        </div>

                        <div className="contact-info-card">
                            <div className="contact-info-icon">✉️</div>
                            <h3>Email Support</h3>
                            <p className="contact-info-value">support@salonbook.com</p>
                            <p className="contact-info-desc">Response within 2 hours</p>
                        </div>

                        <div className="contact-info-card">
                            <div className="contact-info-icon">📍</div>
                            <h3>Head Office</h3>
                            <p className="contact-info-value">Mumbai, Maharashtra</p>
                            <p className="contact-info-desc">India</p>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="contact-faq">
                    <h2>Frequently Asked Questions</h2>
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h3>Is the AI assistant free to use?</h3>
                            <p>Yes! Calling Sophia AI is completely free. Standard call charges may apply from your carrier.</p>
                        </div>

                        <div className="faq-item">
                            <h3>What languages does Sophia support?</h3>
                            <p>Sophia currently supports English, Hindi, and major regional languages across India.</p>
                        </div>

                        <div className="faq-item">
                            <h3>Can I cancel or modify my booking?</h3>
                            <p>Absolutely! Just call Sophia again and mention your booking ID. You can modify or cancel anytime.</p>
                        </div>

                        <div className="faq-item">
                            <h3>How secure is my information?</h3>
                            <p>We use bank-level encryption. Your personal data is never shared with third parties.</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="contact-cta">
                    <div className="contact-cta-content">
                        <h2>Ready to Book Your Perfect Look?</h2>
                        <p>Sophia AI is waiting to help you schedule your next salon appointment</p>
                        <button className="cta-call-button" onClick={handleAICallClick}>
                            <span className="call-icon-large">📞</span>
                            Call AI Assistant
                        </button>
                        <p className="cta-subtitle">Or browse salons and <a href="/salons">book online</a></p>
                    </div>
                </section>
            </div>

            <style jsx>{`
                .contact-page {
                    min-height: 100vh;
                    background: #ffffff;
                }

                .contact-hero {
                    background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
                    padding: 6rem 2rem;
                    position: relative;
                    overflow: hidden;
                }

                .contact-hero-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    text-align: center;
                    position: relative;
                    z-index: 2;
                }

                .ai-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: rgba(255, 107, 157, 0.1);
                    color: #FF6B9D;
                    padding: 0.5rem 1rem;
                    border-radius: 50px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                    border: 1px solid rgba(255, 107, 157, 0.2);
                }

                .contact-hero h1 {
                    font-size: 3.5rem;
                    font-weight: 800;
                    color: #1a1a1a;
                    line-height: 1.2;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .contact-hero-subtitle {
                    font-size: 1.25rem;
                    color: #666;
                    max-width: 600px;
                    margin: 0 auto 3rem;
                    line-height: 1.6;
                }

                .ai-call-button {
                    background: #FF6B9D;
                    color: white;
                    border: none;
                    padding: 1.25rem 3rem;
                    border-radius: 50px;
                    font-size: 1.2rem;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 10px 30px rgba(255, 107, 157, 0.3);
                    position: relative;
                    overflow: hidden;
                }

                .ai-call-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 15px 40px rgba(255, 107, 157, 0.4);
                    background: #ff528b;
                }

                .ai-call-button.active {
                    background: #10B981;
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
                }

                .contact-availability {
                    margin-top: 2rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    color: #666;
                    font-size: 0.9rem;
                }

                .status-indicator {
                    width: 8px;
                    height: 8px;
                    background: #10B981;
                    border-radius: 50%;
                    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
                    animation: pulse 2s infinite;
                }

                .contact-hero-visual {
                    margin-top: 4rem;
                    display: flex;
                    justify-content: center;
                }

                .ai-assistant-card {
                    background: white;
                    padding: 3rem;
                    border-radius: 24px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.05);
                    text-align: center;
                    max-width: 400px;
                    width: 100%;
                    position: relative;
                    border: 1px solid rgba(0, 0, 0, 0.05);
                }

                .ai-avatar {
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 1.5rem;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ai-avatar-inner {
                    width: 80px;
                    height: 80px;
                    background: linear-gradient(135deg, #FF6B9D 0%, #FF8E75 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    position: relative;
                    z-index: 2;
                    box-shadow: 0 10px 20px rgba(255, 107, 157, 0.3);
                }

                .ai-pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid #FF6B9D;
                    opacity: 0;
                    animation: ripple 2s infinite;
                }

                .ai-pulse-ring.delay {
                    animation-delay: 0.5s;
                }

                .ai-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 1rem;
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid #f0f0f0;
                }

                .ai-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .ai-stat-value {
                    font-weight: 700;
                    font-size: 1.2rem;
                    color: #1a1a1a;
                }

                .ai-stat-label {
                    font-size: 0.8rem;
                    color: #999;
                }

                .how-it-works {
                    padding: 6rem 2rem;
                    background: white;
                    text-align: center;
                }

                .how-it-works h2 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    color: #1a1a1a;
                }

                .section-subtitle {
                    color: #666;
                    margin-bottom: 4rem;
                    font-size: 1.1rem;
                }

                .steps-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .step-card {
                    padding: 2rem;
                    background: #f9fafb;
                    border-radius: 20px;
                    position: relative;
                    transition: transform 0.3s ease;
                }

                .step-card:hover {
                    transform: translateY(-5px);
                }

                .step-number {
                    width: 40px;
                    height: 40px;
                    background: #1a1a1a;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    margin: 0 auto 1.5rem;
                }

                .step-icon {
                    font-size: 3rem;
                    margin-bottom: 1.5rem;
                }

                .ai-capabilities {
                    padding: 6rem 2rem;
                    background: #f9fafb;
                }

                .ai-capabilities h2 {
                    text-align: center;
                    font-size: 2.5rem;
                    margin-bottom: 4rem;
                    color: #1a1a1a;
                }

                .capabilities-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .capability-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    transition: all 0.3s ease;
                    border: 1px solid #eee;
                }

                .capability-card:hover {
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                    transform: translateY(-5px);
                    border-color: transparent;
                }

                .capability-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1.5rem;
                    display: block;
                }

                .contact-info-section {
                    padding: 6rem 2rem;
                    background: white;
                }

                .contact-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .contact-info-card {
                    text-align: center;
                    padding: 2rem;
                    border-radius: 16px;
                    background: #fff;
                    border: 1px solid #eee;
                }

                .contact-info-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                }

                .contact-faq {
                    padding: 6rem 2rem;
                    background: #fff;
                    max-width: 800px;
                    margin: 0 auto;
                }

                .contact-faq h2 {
                    text-align: center;
                    font-size: 2.5rem;
                    margin-bottom: 4rem;
                }

                .faq-grid {
                    display: grid;
                    gap: 2rem;
                }

                .faq-item {
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #eee;
                }

                .faq-item h3 {
                    font-size: 1.2rem;
                    margin-bottom: 0.5rem;
                    color: #1a1a1a;
                }

                .faq-item p {
                    color: #666;
                    line-height: 1.6;
                }

                .contact-cta {
                    padding: 6rem 2rem;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    color: white;
                    text-align: center;
                }

                .contact-cta h2 {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .cta-call-button {
                    background: white;
                    color: #1a1a1a;
                    border: none;
                    padding: 1.25rem 3rem;
                    border-radius: 50px;
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin: 2rem 0;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: transform 0.2s;
                }

                .cta-call-button:hover {
                    transform: scale(1.05);
                }

                .cta-subtitle a {
                    color: #FF6B9D;
                    text-decoration: none;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }

                @keyframes ripple {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }

                @media (max-width: 768px) {
                    .contact-hero h1 { font-size: 2.5rem; }
                    .ai-stats { grid-template-columns: 1fr; }
                }
            `}</style>
        </>
    );
}
