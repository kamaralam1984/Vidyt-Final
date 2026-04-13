'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'hinglish'
  | 'es'
  | 'ar'
  | 'id'
  | 'ur';

export interface LocaleState {
  countryCode: string; // e.g. IN, US
  countryName: string;
  flag: string; // emoji flag
  language: LanguageCode;
  currency: string; // ISO, e.g. INR
  currencySymbol: string; // e.g. ₹
  phoneCode: string; // e.g. +91
  phoneLength: number; // standard mobile length, e.g. 10
}

const DEFAULT_LOCALE: LocaleState = {
  countryCode: 'US',
  countryName: 'United States',
  flag: '🇺🇸',
  language: 'en',
  currency: 'USD',
  currencySymbol: '$',
  phoneCode: '+1',
  phoneLength: 10,
};

export const SUPPORTED_LOCALES: LocaleState[] = [
  DEFAULT_LOCALE,
  {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    language: 'hi',
    currency: 'INR',
    currencySymbol: '₹',
    phoneCode: '+91',
    phoneLength: 10,
  },
  {
    countryCode: 'IN-HINGLISH',
    countryName: 'India (Hinglish)',
    flag: '🇮🇳',
    language: 'hinglish',
    currency: 'INR',
    currencySymbol: '₹',
    phoneCode: '+91',
    phoneLength: 10,
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    language: 'en',
    currency: 'GBP',
    currencySymbol: '£',
    phoneCode: '+44',
    phoneLength: 10,
  },
  {
    countryCode: 'EU',
    countryName: 'Europe',
    flag: '🇪🇺',
    language: 'en',
    currency: 'EUR',
    currencySymbol: '€',
    phoneCode: '+49',
    phoneLength: 11,
  },
  {
    countryCode: 'US-INTL',
    countryName: 'United States (Global)',
    flag: '🇺🇸',
    language: 'en',
    currency: 'USD',
    currencySymbol: '$',
    phoneCode: '+1',
    phoneLength: 10,
  },
  {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    language: 'ar',
    currency: 'AED',
    currencySymbol: 'د.إ',
    phoneCode: '+971',
    phoneLength: 9,
  },
  {
    countryCode: 'SG',
    countryName: 'Singapore',
    flag: '🇸🇬',
    language: 'en',
    currency: 'SGD',
    currencySymbol: 'S$',
    phoneCode: '+65',
    phoneLength: 8,
  },
  {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    language: 'en',
    currency: 'AUD',
    currencySymbol: 'A$',
    phoneCode: '+61',
    phoneLength: 9,
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    language: 'en',
    currency: 'CAD',
    currencySymbol: 'C$',
    phoneCode: '+1',
    phoneLength: 10,
  },
  {
    countryCode: 'ES',
    countryName: 'Spain',
    flag: '🇪🇸',
    language: 'es',
    currency: 'EUR',
    currencySymbol: '€',
    phoneCode: '+34',
    phoneLength: 9,
  },
  {
    countryCode: 'MX',
    countryName: 'Mexico',
    flag: '🇲🇽',
    language: 'es',
    currency: 'MXN',
    currencySymbol: '$',
    phoneCode: '+52',
    phoneLength: 10,
  },
  {
    countryCode: 'ID',
    countryName: 'Indonesia',
    flag: '🇮🇩',
    language: 'id',
    currency: 'IDR',
    currencySymbol: 'Rp',
    phoneCode: '+62',
    phoneLength: 11,
  },
  {
    countryCode: 'PK',
    countryName: 'Pakistan',
    flag: '🇵🇰',
    language: 'ur',
    currency: 'PKR',
    currencySymbol: '₨',
    phoneCode: '+92',
    phoneLength: 10,
  },
];

interface LocaleContextValue {
  locale: LocaleState;
  setLocale: (locale: LocaleState) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

const STORAGE_KEY = 'viralboost-locale';

/**
 * Map Cloudflare country codes (ISO 3166-1 alpha-2) to our supported locale countryCode.
 * Countries not listed here fall through to browser-language detection or default US/en.
 */
const COUNTRY_TO_LOCALE: Record<string, string> = {
  // English-speaking
  US: 'US', GB: 'GB', AU: 'AU', CA: 'CA', SG: 'SG', NZ: 'AU', IE: 'GB', ZA: 'GB',
  // India
  IN: 'IN',
  // Spanish-speaking
  ES: 'ES', MX: 'MX', AR: 'MX', CO: 'MX', CL: 'MX', PE: 'MX', VE: 'MX', EC: 'MX',
  // Arabic-speaking
  AE: 'AE', SA: 'AE', QA: 'AE', KW: 'AE', BH: 'AE', OM: 'AE', EG: 'AE', JO: 'AE', LB: 'AE', IQ: 'AE',
  // Indonesia
  ID: 'ID',
  // Pakistan / Urdu
  PK: 'PK',
  // Europe (default EUR)
  DE: 'EU', FR: 'EU', IT: 'EU', NL: 'EU', BE: 'EU', AT: 'EU', PT: 'EU', GR: 'EU', FI: 'EU', SE: 'EU', NO: 'EU', DK: 'EU', PL: 'EU', CZ: 'EU', RO: 'EU', HU: 'EU', BG: 'EU', HR: 'EU', SK: 'EU', SI: 'EU', LT: 'EU', LV: 'EU', EE: 'EU', LU: 'EU', MT: 'EU', CY: 'EU',
};

/**
 * Map browser language prefixes to locale countryCode
 */
const LANG_TO_LOCALE: Record<string, string> = {
  hi: 'IN',
  es: 'ES',
  ar: 'AE',
  id: 'ID',
  ur: 'PK',
};

/** Read a cookie value by name */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleState>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check localStorage (user's explicit choice takes priority)
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocaleState;
        const match = SUPPORTED_LOCALES.find((l) => l.countryCode === parsed.countryCode);
        if (match) {
          setLocaleState(match);
          return;
        }
      }
    } catch {
      // ignore
    }

    // 2. Auto-detect from Cloudflare country cookie (set by middleware)
    try {
      const detectedCountry = getCookie('detected-country');
      if (detectedCountry) {
        const mappedCode = COUNTRY_TO_LOCALE[detectedCountry];
        if (mappedCode) {
          const match = SUPPORTED_LOCALES.find((l) => l.countryCode === mappedCode);
          if (match) {
            setLocaleState(match);
            // Save so user doesn't re-detect every time
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    // 3. Fallback: browser language detection (broader than before)
    try {
      const lang = (navigator.language || 'en-US').toLowerCase();
      const langPrefix = lang.split('-')[0];
      const mappedCode = LANG_TO_LOCALE[langPrefix];
      if (mappedCode) {
        const match = SUPPORTED_LOCALES.find((l) => l.countryCode === mappedCode);
        if (match) {
          setLocaleState(match);
          return;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = (next: LocaleState) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore when browser blocks storage.
      }
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

