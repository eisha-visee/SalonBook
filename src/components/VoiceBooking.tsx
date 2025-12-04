'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ParsedBooking } from '@/lib/bookingParser';

interface VoiceBookingProps {
    isOpen: boolean;
    onClose: () => void;
}

type ConversationStep = 'welcome' | 'name' | 'email' | 'phone' | 'salon' | 'service' | 'date' | 'time' | 'confirm' | 'complete';

export default function VoiceBooking({ isOpen, onClose }: VoiceBookingProps) {
    const [isListening, setIsListening] = useState(false);
    const [currentStep, setCurrentStep] = useState<ConversationStep>('welcome');
    const [bookingData, setBookingData] = useState<Partial<ParsedBooking>>({});
    const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user'; text: string }>>([]);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const stepPrompts: Record<ConversationStep, string> = {
        welcome: "Hello! I'm your salon booking assistant. May I have your name?",
        name: "Thank you! What is your email address?",
        email: "Great! And your phone number? Please say the 10 digits.",
        phone: "Perfect! Which salon? We have Glamour Lounge, Bliss Beauty Studio, or Radiance Salon.",
        salon: "Excellent! What service? We offer Haircut, Hair Coloring, Spa, Manicure, Pedicure, Makeup, or Facial.",
        service: "Wonderful! What date? You can say today or tomorrow.",
        date: "And what time? For example, say 2 PM or 2:30 PM.",
        time: "Let me confirm your booking. Say yes to confirm or no to restart.",
        confirm: "Your booking is confirmed! You'll get a confirmation email shortly.",
        complete: "Thank you for booking with us!"
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
        setMessages(prev => [...prev, { role: 'bot', text }]);
    };

    const processAudioWithElevenLabs = async (audioBlob: Blob) => {
        try {
            const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
            if (!apiKey) {
                throw new Error('ElevenLabs API key not configured');
            }

            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('model_id', 'scribe_v1');

            const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
                method: 'POST',
                headers: { 'xi-api-key': apiKey },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('ElevenLabs API Error:', errorText);
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            const transcript = data.text || '';

            if (!transcript) {
                throw new Error('No transcript returned');
            }

            setMessages(prev => [...prev, { role: 'user', text: transcript }]);
            handleUserResponse(transcript);

        } catch (err) {
            console.error('Error processing audio:', err);
            setError(`Failed to process audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsListening(false);
        }
    };

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await processAudioWithElevenLabs(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsListening(true);
            setError(null);

            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 10000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please grant permission.');
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleUserResponse = (transcript: string) => {
        const lower = transcript.toLowerCase();

        switch (currentStep) {
            case 'welcome':
            case 'name':
                setBookingData(prev => ({ ...prev, customerName: transcript }));
                setCurrentStep('email');
                speak(stepPrompts.email);
                break;

            case 'email':
                const emailMatch = transcript.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
                if (emailMatch) {
                    setBookingData(prev => ({ ...prev, customerEmail: emailMatch[0] }));
                    setCurrentStep('phone');
                    speak(stepPrompts.phone);
                } else {
                    speak("I didn't catch your email. Please try again.");
                }
                break;

            case 'phone':
                const digits = transcript.replace(/\D/g, '');
                if (digits.length === 10) {
                    setBookingData(prev => ({ ...prev, customerPhone: digits }));
                    setCurrentStep('salon');
                    speak(stepPrompts.salon);
                } else {
                    speak("Please say all 10 digits of your phone number.");
                }
                break;

            case 'salon':
                let salonName = '';
                let salonId = '';
                if (lower.includes('glamour')) {
                    salonName = 'Glamour Lounge';
                    salonId = 'glamour-lounge-mumbai';
                } else if (lower.includes('bliss')) {
                    salonName = 'Bliss Beauty Studio';
                    salonId = 'bliss-beauty-studio-delhi';
                } else if (lower.includes('radiance')) {
                    salonName = 'Radiance Salon & Spa';
                    salonId = 'radiance-salon-spa-bangalore';
                }

                if (salonName) {
                    setBookingData(prev => ({ ...prev, salonName, salonId }));
                    setCurrentStep('service');
                    speak(stepPrompts.service);
                } else {
                    speak("Please choose Glamour Lounge, Bliss Beauty Studio, or Radiance Salon.");
                }
                break;

            case 'service':
                let service = null;
                if (lower.includes('haircut')) {
                    service = { id: 'haircut', name: 'Haircut & Styling', price: 1000, duration: 60 };
                } else if (lower.includes('color')) {
                    service = { id: 'hair-coloring', name: 'Hair Coloring', price: 3500, duration: 120 };
                } else if (lower.includes('spa')) {
                    service = { id: 'spa-treatment', name: 'Spa Treatment', price: 4500, duration: 120 };
                } else if (lower.includes('manicure') || lower.includes('pedicure')) {
                    service = { id: 'manicure-pedicure', name: 'Manicure & Pedicure', price: 1000, duration: 60 };
                } else if (lower.includes('makeup')) {
                    service = { id: 'professional-makeup', name: 'Professional Makeup', price: 3000, duration: 90 };
                } else if (lower.includes('facial')) {
                    service = { id: 'facial-treatment', name: 'Facial Treatment', price: 1500, duration: 75 };
                }

                if (service) {
                    setBookingData(prev => ({ ...prev, services: [service], totalAmount: service.price }));
                    setCurrentStep('date');
                    speak(stepPrompts.date);
                } else {
                    speak("Please choose from Haircut, Hair Coloring, Spa, Manicure, Pedicure, Makeup, or Facial.");
                }
                break;

            case 'date':
                let date = '';
                const today = new Date();

                if (lower.includes('today')) {
                    date = today.toISOString().split('T')[0];
                } else if (lower.includes('tomorrow')) {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    date = tomorrow.toISOString().split('T')[0];
                }

                if (date) {
                    setBookingData(prev => ({ ...prev, date }));
                    setCurrentStep('time');
                    speak(stepPrompts.date);
                } else {
                    speak("Please say today or tomorrow.");
                }
                break;

            case 'time':
                const timeMatch = transcript.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = timeMatch[2] || '00';
                    const period = timeMatch[3].toLowerCase();

                    if (period === 'pm' && hours !== 12) hours += 12;
                    if (period === 'am' && hours === 12) hours = 0;

                    const time = `${hours.toString().padStart(2, '0')}:${minutes}`;
                    setBookingData(prev => ({ ...prev, time }));
                    setCurrentStep('confirm');

                    const summary = `${bookingData.customerName}, booking ${bookingData.services?.[0]?.name} at ${bookingData.salonName} on ${bookingData.date} at ${time}. Say yes to confirm.`;
                    speak(summary);
                } else {
                    speak("Please say the time like 2 PM or 2:30 PM.");
                }
                break;

            case 'confirm':
                if (lower.includes('yes')) {
                    saveBooking();
                } else {
                    setBookingData({});
                    setCurrentStep('welcome');
                    setMessages([]);
                    speak("Let's start over. What is your name?");
                }
                break;
        }
    };

    const saveBooking = async () => {
        try {
            await addDoc(collection(db, 'bookings'), {
                ...bookingData,
                createdAt: new Date().toISOString(),
                status: 'pending',
                bookingSource: 'voice-assistant',
            });

            setCurrentStep('complete');
            speak(stepPrompts.confirm);

            setTimeout(() => {
                handleClose();
            }, 3000);
        } catch (err) {
            console.error('Error saving:', err);
            speak("Sorry, error saving your booking. Please try again.");
        }
    };

    useEffect(() => {
        if (isOpen && currentStep === 'welcome' && messages.length === 0) {
            speak(stepPrompts.welcome);
        }
    }, [isOpen]);

    const handleClose = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        window.speechSynthesis.cancel();
        setIsListening(false);
        setCurrentStep('welcome');
        setBookingData({});
        setMessages([]);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="voice-booking-overlay">
            <div className="voice-booking-modal">
                <button className="close-btn" onClick={handleClose}>×</button>

                <div className="header">
                    <div className={`avatar ${isListening ? 'listening' : ''}`}>
                        {isListening ? '🎤' : '🤖'}
                    </div>
                    <h2>Voice Booking Assistant</h2>
                    <p className="status">
                        {error ? <span className="error">❌ {error}</span> :
                            isListening ? 'Recording...' : 'Ready'}
                    </p>
                </div>

                <div className="conversation">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`}>
                            <span className="icon">{msg.role === 'bot' ? '🤖' : '👤'}</span>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                </div>

                <div className="controls">
                    {!isListening && currentStep !== 'complete' && (
                        <button className="record-btn" onClick={startListening}>
                            🎤 Tap to Speak
                        </button>
                    )}
                    {isListening && (
                        <button className="stop-btn" onClick={stopListening}>
                            ⏹️ Stop Recording
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                .voice-booking-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(8px);
                }

                .voice-booking-modal {
                    background: white;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    border-radius: 24px;
                    padding: 2rem;
                    position: relative;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    display: flex;
                    flex-direction: column;
                }

                .close-btn {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: #f3f4f6;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .close-btn:hover {
                    background: #e5e7eb;
                    transform: rotate(90deg);
                }

                .header {
                    text-align: center;
                    margin-bottom: 1.5rem;
                }

                .avatar {
                    width: 100px;
                    height: 100px;
                    background: #f3f4f6;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    margin: 0 auto 1rem;
                    transition: all 0.3s;
                }

                .avatar.listening {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    animation: pulse 1.5s infinite;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                .header h2 {
                    margin: 0 0 0.5rem 0;
                    color: #1f2937;
                }

                .status {
                    color: #6b7280;
                    font-size: 0.9rem;
                }

                .error {
                    color: #ef4444;
                }

                .conversation {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: #f9fafb;
                    border-radius: 16px;
                    max-height: 400px;
                    min-height: 200px;
                }

                .message {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }

                .message.bot {
                    justify-content: flex-start;
                }

                .message.user {
                    justify-content: flex-end;
                    flex-direction: row-reverse;
                }

                .icon {
                    flex-shrink: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }

                .message p {
                    background: white;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    margin: 0;
                    max-width: 80%;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .message.user p {
                    background: #FF6B9D;
                    color: white;
                }

                .controls {
                    text-align: center;
                }

                .record-btn, .stop-btn {
                    background: #FF6B9D;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .record-btn:hover {
                    background: #ff528b;
                    transform: scale(1.05);
                }

                .stop-btn {
                    background: #ef4444;
                }

                .stop-btn:hover {
                    background: #dc2626;
                    transform: scale(1.05);
                }

                @media (max-width: 768px) {
                    .voice-booking-modal {
                        width: 95%;
                        padding: 1.5rem;
                    }

                    .avatar {
                        width: 80px;
                        height: 80px;
                        font-size: 2.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
