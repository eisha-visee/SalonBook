export interface STTResult {
    text: string;
    service: 'browser' | 'openai-whisper' | 'elevenlabs';
}

export interface ConversationResult {
    response: string;
    bookingData?: any;
    service: 'gemini' | 'openai-gpt';
}

// Extend window for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}


// Browser Web Speech API
export async function browserSTT(onResult: (text: string) => void, onError: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            reject(new Error('Browser Speech Recognition not supported'));
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onResult(transcript);
            resolve();
        };

        recognition.onerror = (event: any) => {
            onError(`Recognition error: ${event.error}`);
            reject(new Error(event.error));
        };

        recognition.start();
    });
}

// ElevenLabs STT
export async function elevenLabsSTT(audioBlob: Blob): Promise<string> {
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
        if (response.status === 403) {
            throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error(`ElevenLabs error: ${errorText}`);
    }

    const data = await response.json();
    return data.text || '';
}
