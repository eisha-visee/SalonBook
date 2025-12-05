import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
    apiKey: process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || ''
});

export async function assemblyAISTT(audioBlob: Blob): Promise<string> {
    try {
        // Convert blob to base64
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        // Upload and transcribe
        const transcript = await client.transcripts.transcribe({
            audio: `data:audio/webm;base64,${base64Audio}`,
        });

        if (transcript.status === 'error') {
            throw new Error(transcript.error || 'Transcription failed');
        }

        return transcript.text || '';
    } catch (error: any) {
        console.error('AssemblyAI error:', error);
        if (error?.status === 429 || error?.message?.includes('quota')) {
            throw new Error('QUOTA_EXCEEDED');
        }
        throw new Error(`AssemblyAI transcription failed: ${error?.message || 'Unknown error'}`);
    }
}
