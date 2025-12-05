// Sarvam AI - Indian AI service for STT and translation
export async function sarvamSTT(audioBlob: Blob): Promise<string> {
    try {
        const apiKey = process.env.NEXT_PUBLIC_SARVAM_API_KEY;
        if (!apiKey) {
            throw new Error('Sarvam API key not configured');
        }

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('language_code', 'en-IN'); // English (India)
        formData.append('model', 'saaras:v1'); // Sarvam's STT model

        const response = await fetch('https://api.sarvam.ai/speech-to-text', {
            method: 'POST',
            headers: {
                'api-subscription-key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 429) {
                throw new Error('QUOTA_EXCEEDED');
            }
            throw new Error(`Sarvam error: ${errorText}`);
        }

        const data = await response.json();
        return data.transcript || '';
    } catch (error: any) {
        console.error('Sarvam AI error:', error);
        if (error.message.includes('QUOTA_EXCEEDED')) {
            throw error;
        }
        throw new Error(`Sarvam transcription failed: ${error?.message || 'Unknown error'}`);
    }
}
