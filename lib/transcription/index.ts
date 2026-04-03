import { TranscriptionProvider, TranscriptionResponse, ProviderType } from './types';
import { OpenAIProvider } from './providers/openai';
import { DeepgramProvider } from './providers/deepgram';
import { AssemblyAIProvider } from './providers/assemblyai';
import { LocalWhisperProvider } from './providers/local';
import { isRateLimited } from './rateLimit';
import { getFileHash, getCachedTranscription, setCachedTranscription } from './cache';

// Setup providers in priority order
const providers: TranscriptionProvider[] = [
  new OpenAIProvider(),
  new DeepgramProvider(),
  new AssemblyAIProvider(),
  new LocalWhisperProvider(),
];

// Helper to provide a custom timeout for any promise
const withTimeout = async <T>(promise: Promise<T>, ms: number, providerName: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout of ${ms}ms exceeded for provider: ${providerName}`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
};

/**
 * Orchestrator to transcribe audio using multi-provider fallback.
 */
export async function transcribeAudio(
  file: File | Blob | Buffer,
  fileName: string = 'audio.mp3',
  identifier: string = 'anonymous'
): Promise<TranscriptionResponse> {
  const t0 = performance.now();

  try {
    // 1. Rate Limiting Check
    if (isRateLimited(identifier)) {
      console.warn(`[Transcription] Rate limit exceeded for identifier: ${identifier}`);
      return {
        success: false,
        provider: 'local',
        transcript: '',
        error: 'Too Many Requests. Please wait a minute.',
        processingTime: performance.now() - t0,
      };
    }

    // 2. Buffer Normalization & Cache Check
    let fileBuffer: Buffer;
    if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else if (file instanceof Blob) {
      fileBuffer = Buffer.from(await file.arrayBuffer());
    } else {
      throw new Error('Invalid file type provided to transcribeAudio');
    }

    const fileHash = getFileHash(fileBuffer);
    const cached = getCachedTranscription(fileHash);

    if (cached) {
      console.log(`[Transcription] Cache hit for file hash: ${fileHash}`);
      return {
        success: true,
        provider: cached.provider as ProviderType,
        transcript: cached.transcript,
        processingTime: performance.now() - t0,
      };
    }

    // 3. Provider Cascade Execution
    const timeouts: Record<ProviderType, number> = {
      openai: 15000,
      deepgram: 15000,
      assemblyai: 70000,
      local: 120000,
    };

    let lastError: string = 'All providers failed.';

    for (const provider of providers) {
      try {
        console.log(`[Transcription] Attempting provider: ${provider.name}`);
        const timeoutMs = timeouts[provider.name];

        const response = await withTimeout(
          provider.transcribe(fileBuffer, fileName),
          timeoutMs,
          provider.name
        );

        if (response.success && response.transcript) {
          console.log(`[Transcription] Success with ${provider.name}`);
          
          // Cache successful response
          setCachedTranscription(fileHash, response.transcript, response.provider);
          
          return {
            ...response,
            processingTime: performance.now() - t0,
          };
        } else {
          lastError = response.error || 'Unknown error';
          console.warn(`[Transcription] ${provider.name} failed: ${lastError} → switching to next provider`);
        }
      } catch (err: any) {
        lastError = err.message || JSON.stringify(err);
        console.warn(`[Transcription] ${provider.name} threw error: ${lastError} → switching to next provider`);
      }
    }

    console.error('[Transcription] ALL providers exhausted.');
    return {
      success: false,
      provider: 'local', // Last fallback attempted
      transcript: '',
      error: lastError,
      processingTime: performance.now() - t0,
    };
  } catch (error: any) {
    console.error('[Transcription] Fatal generic wrapper error:', error);
    return {
      success: false,
      provider: 'local',
      transcript: '',
      error: 'AI service temporarily unavailable (Fatal)',
      processingTime: performance.now() - t0,
    };
  }
}
