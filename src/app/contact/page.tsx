'use client';

import { useState } from 'react';

export default function ContactPage() {
    const [isCallActive, setIsCallActive] = useState(false);

    const handleCallClick = () => {
        // This will initiate the phone call
        window.location.href = 'tel:+919876543210';
    };

    const handleAICallClick = () => {
        setIsCallActive(true);
        // Later we'll integrate the actual AI calling service here
        setTimeout(() => {
            handleCallClick();
        }, 500);
    };

    return (
        <>
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
                            <span className="call-button-text">Call AI Assistant</span>
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
        </>
    );
}
