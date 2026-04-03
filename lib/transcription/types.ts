export type ProviderType = 'openai' | 'deepgram' | 'assemblyai' | 'local';

export interface TranscriptionResponse {
  success: boolean;
  provider: ProviderType;
  transcript: string;
  error?: string;
  details?: any;
  processingTime?: number;
}

export interface TranscriptionProvider {
  /**
   * Internal name of the provider
   */
  name: ProviderType;

  /**
   * Transcribe an audio file buffer or blob
   * @param file The audio file
   * @param fallbackTimeout Minimum timeout before throwing error to allow fallback (ms)
   */
  transcribe(file: File | Blob | Buffer, fileName?: string): Promise<TranscriptionResponse>;
}
