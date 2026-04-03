import crypto from 'crypto';

interface CacheEntry {
  transcript: string;
  provider: string;
  timestamp: number;
}

// Simple in-memory cache for process lifetime
const cacheMap = new Map<string, CacheEntry>();

export function getFileHash(baseBuffer: Buffer): string {
  return crypto.createHash('sha256').update(baseBuffer).digest('hex');
}

export function getCachedTranscription(hash: string): { transcript: string; provider: string } | null {
  const entry = cacheMap.get(hash);
  if (entry) {
    return { transcript: entry.transcript, provider: entry.provider };
  }
  return null;
}

export function setCachedTranscription(hash: string, transcript: string, provider: string) {
  cacheMap.set(hash, {
    transcript,
    provider,
    timestamp: Date.now()
  });
}
