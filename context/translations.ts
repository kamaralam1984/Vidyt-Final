'use client';

/**
 * Minimal translations stub.
 * t(key) returns the last segment of the key as a readable label.
 * e.g. t('trending.title') → 'title'
 */
export function useTranslations() {
  const t = (key: string): string => {
    const parts = key.split('.');
    return parts[parts.length - 1];
  };
  return { t };
}
