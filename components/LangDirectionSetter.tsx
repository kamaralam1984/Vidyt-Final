'use client';

import { useEffect } from 'react';
import { useLocale } from '@/context/LocaleContext';

const RTL_LANGUAGES = ['ar', 'ur'];

/**
 * Dynamically sets <html lang=".."> and dir="rtl"/"ltr" based on detected locale.
 * Must be placed inside LocaleProvider.
 */
export default function LangDirectionSetter() {
  const { locale } = useLocale();

  useEffect(() => {
    const html = document.documentElement;

    // Set lang attribute
    html.setAttribute('lang', locale.language);

    // Set direction for RTL languages (Arabic, Urdu)
    const isRtl = RTL_LANGUAGES.includes(locale.language);
    html.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    // Add/remove RTL class for Tailwind utilities
    if (isRtl) {
      html.classList.add('rtl');
    } else {
      html.classList.remove('rtl');
    }
  }, [locale.language]);

  return null;
}
