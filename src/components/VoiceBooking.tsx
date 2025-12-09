'use client';

import { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MultiServiceManager } from '@/lib/multiServiceManager';
import { BookingData } from '@/lib/geminiService';

interface VoiceBookingProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function VoiceBooking({ isOpen, onClose }: VoiceBookingProps) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [messages, setMessages] = useState<Array<{ role: 'bot' | 'user'; text: string }>>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeServices, setActiveServices] = useState<{ stt: string; ai: string }>({ stt: '', ai: '' });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const serviceManagerRef = useRef<MultiServiceManager | null>(null);

    // Initialize service manager
    useEffect(() => {
        if (isOpen && !serviceManagerRef.current) {
            serviceManagerRef.current = new MultiServiceManager();
            const greeting = serviceManagerRef.current.getInitialGreeting();
            setMessages([{ role: 'bot', text: greeting }]);
            speak(greeting);
            updateServices();
        }
    }, [isOpen]);

    const updateServices = () => {
        if (serviceManagerRef.current) {
            const services = serviceManagerRef.current.getCurrentServices();
            setActiveServices({ stt: services.stt, ai: services.conversation });
        }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;

            // Auto-start recording after AI finishes speaking
            utterance.onend = () => {
                setTimeout(() => {
                    if (!isProcessing) {
                        startListening();
                    }
                }, 500); // Small delay before starting
            };

            window.speechSynthesis.speak(utterance);
        }
    };

    const startListening = async () => {
        if (isListening || isProcessing) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            let silenceTimeout: NodeJS.Timeout | null = null;
            let lastSoundTime = Date.now();

            // Audio level detection for silence
            const audioContext = new AudioContext();
            const audioStreamSource = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            audioStreamSource.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const domainData = new Uint8Array(bufferLength);

            const detectSound = () => {
                if (mediaRecorder.state !== 'recording') {
                    if (audioContext.state !== 'closed') {
                        audioContext.close();
                    }
                    return;
                }

                analyser.getByteFrequencyData(domainData);

                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += domainData[i];
                }
                const average = sum / bufferLength;

                // If sound detected (above threshold)
                if (average > 10) {
                    lastSoundTime = Date.now();
                    // Clear existing silence timeout
                    if (silenceTimeout) {
                        clearTimeout(silenceTimeout);
                        silenceTimeout = null;
                    }
                } else {
                    // If no recent sound and no timeout set, start silence timer
                    const silenceDuration = Date.now() - lastSoundTime;
                    if (silenceDuration > 1500 && !silenceTimeout) {
                        // Stop after 1.5 seconds of silence
                        mediaRecorder.stop();
                        setIsListening(false);
                        if (audioContext.state !== 'closed') {
                            audioContext.close();
                        }
                        return;
                    }
                }

                requestAnimationFrame(detectSound);
            };

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                if (audioBlob.size > 0) {
                    await processAudio(audioBlob);
                }
                stream.getTracks().forEach(track => track.stop());
                if (audioContext.state !== 'closed') {
                    audioContext.close();
                }
            };

            mediaRecorder.start();
            setIsListening(true);
            setError(null);

            // Start silence detection
            detectSound();

            // Absolute max timeout of 10 seconds
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    setIsListening(false);
                }
            }, 10000);

        } catch (err) {
            console.error('Microphone error:', err);
            setError('Could not access microphone. Please grant permission.');
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsListening(false);
        }
    };

    const processAudio = async (audioBlob: Blob) => {
        if (!serviceManagerRef.current) return;

        setIsProcessing(true);
        try {
            // Multi-service STT with auto-fallback
            const { text: transcript, service: sttService } = await serviceManagerRef.current.transcribeAudio(audioBlob);

            console.log(`Transcribed by ${sttService}:`, transcript);
            setMessages(prev => [...prev, { role: 'user', text: transcript }]);
            updateServices();

            // Multi-service conversation with auto-fallback
            const { response, bookingData, service: aiService } = await serviceManagerRef.current.sendMessage(transcript);

            console.log(`Response from ${aiService}:`, response);
            setMessages(prev => [...prev, { role: 'bot', text: response }]);
            speak(response);
            updateServices();

            if (bookingData) {
                await saveBooking(bookingData);
            }

        } catch (err: any) {
            console.error('Processing error:', err);
            const errorMsg = err.message || 'Failed to process your message. Please try again.';
            setError(errorMsg);
            setMessages(prev => [...prev, { role: 'bot', text: `Sorry, ${errorMsg}` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const saveBooking = async (bookingData: BookingData) => {
        try {
            await addDoc(collection(db, 'bookings'), {
                ...bookingData,
                createdAt: new Date().toISOString(),
                status: 'pending',
                bookingSource: 'voice-assistant-multi-service',
            });

            const confirmMsg = "Your booking has been confirmed! You'll receive a confirmation email shortly.";
            setMessages(prev => [...prev, { role: 'bot', text: confirmMsg }]);
            speak(confirmMsg);

            setTimeout(() => {
                handleClose();
            }, 3000);
        } catch (err) {
            console.error('Firestore error:', err);
            const errorMsg = "Sorry, there was an error saving your booking. Please try again.";
            setMessages(prev => [...prev, { role: 'bot', text: errorMsg }]);
            speak(errorMsg);
        }
    };

    const handleClose = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        window.speechSynthesis.cancel();
        setIsListening(false);
        setIsProcessing(false);
        setMessages([]);
        setError(null);
        serviceManagerRef.current = null;
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="voice-booking-overlay">
            <div className="voice-booking-modal">
                <button className="close-btn" onClick={handleClose}>×</button>

                <div className="header">
                    <div className={`avatar ${isListening ? 'listening' : isProcessing ? 'processing' : ''}`}>
                        {isListening ? '🎤' : isProcessing ? '⚙️' : '🤖'}
                    </div>
                    <h2>Multi-Service AI Assistant</h2>
                    <p className="status">
                        {error ? <span className="error">⚠️ {error}</span> :
                            isListening ? '📢 Recording...' :
                                isProcessing ? '⏳ Processing...' :
                                    '👂 Ready to help'}
                    </p>
                    {activeServices.stt && (
                        <p className="service-info">
                            <small>
                                🎤 {activeServices.stt} • 🤖 {activeServices.ai}
                            </small>
                        </p>
                    )}
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
                    {isListening && (
                        <div className="auto-recording">
                            <div className="pulse-dot"></div>
                            <span>Listening... (speak naturally)</span>
                        </div>
                    )}
                    {isProcessing && (
                        <div className="processing-indicator">Processing your response...</div>
                    )}
                    {!isListening && !isProcessing && (
                        <div className="waiting-indicator">
                            <span>🎤 Auto-recording enabled - I'll listen after I speak</span>
                        </div>
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
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

                .avatar.processing {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    animation: spin 2s linear infinite;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .header h2 {
                    margin: 0 0 0.5rem 0;
                    color: #1f2937;
                    font-size: 1.5rem;
                }

                .status {
                    color: #6b7280;
                    font-size: 0.9rem;
                    margin: 0.5rem 0;
                }

                .service-info {
                    color: #9ca3af;
                    font-size: 0.75rem;
                    margin: 0.25rem 0;
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
                    animation: slideIn 0.3s ease;
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
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
                    background: #667eea;
                    color: white;
                }

                .controls {
                    text-align: center;
                    min-height: 60px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .auto-recording {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #ef4444;
                    font-weight: 600;
                    font-size: 1.1rem;
                }

                .pulse-dot {
                    width: 12px;
                    height: 12px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse-dot 1.5s infinite;
                }

                @keyframes pulse-dot {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.3);
                        opacity: 0.7;
                    }
                }

                .waiting-indicator {
                    color: #9ca3af;
                    font-size: 0.9rem;
                }

                .processing-indicator {
                    color: #667eea;
                    font-weight: 600;
                    animation: blink 1s infinite;
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
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
