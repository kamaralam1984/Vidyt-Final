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

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleState>(DEFAULT_LOCALE);

  useEffect(() => {
    if (typeof window === 'undefined') return;
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
    // Fallback: try browser language
    try {
      const lang = navigator.language || 'en-US';
      if (lang.startsWith('hi') || lang.endsWith('IN')) {
        const india = SUPPORTED_LOCALES.find((l) => l.countryCode === 'IN');
        if (india) setLocaleState(india);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = (next: LocaleState) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

