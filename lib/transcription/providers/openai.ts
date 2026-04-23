import { TranscriptionProvider, TranscriptionResponse } from '../types';

export class OpenAIProvider implements TranscriptionProvider {
  name = 'openai' as const;

  async transcribe(file: File | Blob | Buffer, fileName: string = 'audio.mp3'): Promise<TranscriptionResponse> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not defined');
      }

      const formData = new FormData();
      
      // If window is defined or File constructor is available globally
      // Need to handle Buffer if on server backend correctly
      let fileToUpload: File | Blob;
      if (Buffer.isBuffer(file)) {
        fileToUpload = new File([new Uint8Array(file)], fileName, { type: 'audio/mpeg' });
      } else {
        fileToUpload = file;
      }
      
      formData.append('file', fileToUpload, fileName);
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          throw new Error('OpenAI Quota Exceeded (429)');
        }
        throw new Error(`OpenAI API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (!data.text) {
        throw new Error('Invalid response from OpenAI (missing text)');
      }

      return {
        success: true,
        provider: this.name,
        transcript: data.text,
      };
    } catch (error: any) {
      console.error('[OpenAIProvider Error]:', error.message);
      return {
        success: false,
        provider: this.name,
        transcript: '',
        error: error.message || 'Unknown OpenAI Error',
      };
    }
  }
}
