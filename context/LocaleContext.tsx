'use client';

import React, { createContext, useContext, useState } from 'react';

export interface LocaleOption {
  countryCode: string;
  countryName: string;
  flag: string;
  currencySymbol: string;
  currency: string;       // ISO currency code, e.g. 'USD', 'INR'
  phoneCode: string;
  phoneLength: number;    // expected local phone digits (without country code)
  lang: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { countryCode: 'US', countryName: 'United States', flag: '🇺🇸', currencySymbol: '$',   currency: 'USD', phoneCode: '+1',   phoneLength: 10, lang: 'en' },
  { countryCode: 'IN', countryName: 'India',          flag: '🇮🇳', currencySymbol: '₹',   currency: 'INR', phoneCode: '+91',  phoneLength: 10, lang: 'hi' },
  { countryCode: 'GB', countryName: 'United Kingdom', flag: '🇬🇧', currencySymbol: '£',   currency: 'GBP', phoneCode: '+44',  phoneLength: 10, lang: 'en' },
  { countryCode: 'AE', countryName: 'UAE',            flag: '🇦🇪', currencySymbol: 'AED', currency: 'AED', phoneCode: '+971', phoneLength: 9,  lang: 'ar' },
  { countryCode: 'PK', countryName: 'Pakistan',       flag: '🇵🇰', currencySymbol: '₨',   currency: 'PKR', phoneCode: '+92',  phoneLength: 10, lang: 'ur' },
  { countryCode: 'DE', countryName: 'Germany',        flag: '🇩🇪', currencySymbol: '€',   currency: 'EUR', phoneCode: '+49',  phoneLength: 10, lang: 'de' },
  { countryCode: 'FR', countryName: 'France',         flag: '🇫🇷', currencySymbol: '€',   currency: 'EUR', phoneCode: '+33',  phoneLength: 9,  lang: 'fr' },
  { countryCode: 'ES', countryName: 'Spain',          flag: '🇪🇸', currencySymbol: '€',   currency: 'EUR', phoneCode: '+34',  phoneLength: 9,  lang: 'es' },
  { countryCode: 'BR', countryName: 'Brazil',         flag: '🇧🇷', currencySymbol: 'R$',  currency: 'BRL', phoneCode: '+55',  phoneLength: 11, lang: 'pt' },
  { countryCode: 'AU', countryName: 'Australia',      flag: '🇦🇺', currencySymbol: 'A$',  currency: 'AUD', phoneCode: '+61',  phoneLength: 9,  lang: 'en' },
  { countryCode: 'CA', countryName: 'Canada',         flag: '🇨🇦', currencySymbol: 'C$',  currency: 'CAD', phoneCode: '+1',   phoneLength: 10, lang: 'en' },
  { countryCode: 'SG', countryName: 'Singapore',      flag: '🇸🇬', currencySymbol: 'S$',  currency: 'SGD', phoneCode: '+65',  phoneLength: 8,  lang: 'en' },
  { countryCode: 'ID', countryName: 'Indonesia',      flag: '🇮🇩', currencySymbol: 'Rp',  currency: 'IDR', phoneCode: '+62',  phoneLength: 12, lang: 'id' },
  { countryCode: 'MX', countryName: 'Mexico',         flag: '🇲🇽', currencySymbol: 'MX$', currency: 'MXN', phoneCode: '+52',  phoneLength: 10, lang: 'es' },
];

export type Locale = LocaleOption;

interface LocaleContextValue {
  locale: LocaleOption;
  setLocale: (locale: LocaleOption) => void;
}

const DEFAULT_LOCALE = SUPPORTED_LOCALES[0];

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<LocaleOption>(DEFAULT_LOCALE);
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
