import { TranscriptionProvider, TranscriptionResponse } from '../types';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class AssemblyAIProvider implements TranscriptionProvider {
  name = 'assemblyai' as const;

  async transcribe(file: File | Blob | Buffer, fileName: string = 'audio.mp3'): Promise<TranscriptionResponse> {
    try {
      const apiKey = process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey) {
        throw new Error('ASSEMBLYAI_API_KEY is not defined');
      }

      let body: Buffer | ArrayBuffer | Blob | File;
      if (Buffer.isBuffer(file)) {
        body = file;
      } else if (file instanceof Blob || file instanceof File) {
        body = await file.arrayBuffer();
      } else {
        body = file;
      }

      // Step 1: Upload the audio
      const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
        },
        body: body as BodyInit,
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.text();
        throw new Error(`AssemblyAI upload error: ${uploadResponse.status} - ${err}`);
      }

      const uploadData = await uploadResponse.json();
      const uploadUrl = uploadData.upload_url;

      if (!uploadUrl) {
        throw new Error('No upload URL returned from AssemblyAI');
      }

      // Step 2: Request transcription
      const transcriptRequest = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio_url: uploadUrl }),
      });

      if (!transcriptRequest.ok) {
        const err = await transcriptRequest.text();
        throw new Error(`AssemblyAI transcript request error: ${transcriptRequest.status} - ${err}`);
      }

      const transcriptData = await transcriptRequest.json();
      const transcriptId = transcriptData.id;

      // Step 3: Poll for completion
      // We limit to 30 attempts, 2 seconds each (~60s)
      let outText = '';
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await sleep(2000);
        attempts++;

        const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          method: 'GET',
          headers: {
            'Authorization': apiKey,
          },
        });

        if (!pollResponse.ok) {
          throw new Error(`AssemblyAI polling error: ${pollResponse.status}`);
        }

        const pollData = await pollResponse.json();

        if (pollData.status === 'completed') {
          outText = pollData.text;
          break;
        } else if (pollData.status === 'error') {
          throw new Error(`AssemblyAI transcription error: ${pollData.error}`);
        }
        // status is "queued" or "processing" - continue polling
      }

      if (!outText) {
        throw new Error('AssemblyAI timeout or failed to return text.');
      }

      return {
        success: true,
        provider: this.name,
        transcript: outText,
      };

    } catch (error: any) {
      console.error('[AssemblyAIProvider Error]:', error.message);
      return {
        success: false,
        provider: this.name,
        transcript: '',
        error: error.message || 'Unknown AssemblyAI Error',
      };
    }
  }
}
