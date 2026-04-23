import { TranscriptionProvider, TranscriptionResponse } from '../types';

export class DeepgramProvider implements TranscriptionProvider {
  name = 'deepgram' as const;

  async transcribe(file: File | Blob | Buffer, fileName: string = 'audio.mp3'): Promise<TranscriptionResponse> {
    try {
      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPGRAM_API_KEY is not defined');
      }
      
      let body: Buffer | ArrayBuffer | Blob | File;
      if (Buffer.isBuffer(file)) {
        body = file;
      } else if ('arrayBuffer' in (file as object)) {
        body = await (file as Blob).arrayBuffer();
      } else {
        body = file;
      }

      const response = await fetch('https://api.deepgram.com/v1/listen?model=general&smart_format=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/mpeg' // Adjust based on dynamic if needed, but deepgram handles raw streams well
        },
        body: body as BodyInit,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          throw new Error('Deepgram Rate Limit Exceeded (429)');
        }
        throw new Error(`Deepgram API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

      if (!transcript) {
        throw new Error('Invalid response from Deepgram (missing transcript)');
      }

      return {
        success: true,
        provider: this.name,
        transcript: transcript,
      };
    } catch (error: any) {
      console.error('[DeepgramProvider Error]:', error.message);
      return {
        success: false,
        provider: this.name,
        transcript: '',
        error: error.message || 'Unknown Deepgram Error',
      };
    }
  }
}
