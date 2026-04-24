'use client';

import React, { createContext, useContext, useState } from 'react';

export interface LocaleOption {
  countryCode: string;
  countryName: string;
  flag: string;
  currencySymbol: string;
  phoneCode: string;
  lang: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { countryCode: 'US', countryName: 'United States', flag: '🇺🇸', currencySymbol: '$', phoneCode: '+1', lang: 'en' },
  { countryCode: 'IN', countryName: 'India', flag: '🇮🇳', currencySymbol: '₹', phoneCode: '+91', lang: 'hi' },
  { countryCode: 'GB', countryName: 'United Kingdom', flag: '🇬🇧', currencySymbol: '£', phoneCode: '+44', lang: 'en' },
  { countryCode: 'AE', countryName: 'UAE', flag: '🇦🇪', currencySymbol: 'AED', phoneCode: '+971', lang: 'ar' },
  { countryCode: 'PK', countryName: 'Pakistan', flag: '🇵🇰', currencySymbol: '₨', phoneCode: '+92', lang: 'ur' },
  { countryCode: 'DE', countryName: 'Germany', flag: '🇩🇪', currencySymbol: '€', phoneCode: '+49', lang: 'de' },
  { countryCode: 'FR', countryName: 'France', flag: '🇫🇷', currencySymbol: '€', phoneCode: '+33', lang: 'fr' },
  { countryCode: 'ES', countryName: 'Spain', flag: '🇪🇸', currencySymbol: '€', phoneCode: '+34', lang: 'es' },
  { countryCode: 'BR', countryName: 'Brazil', flag: '🇧🇷', currencySymbol: 'R$', phoneCode: '+55', lang: 'pt' },
  { countryCode: 'AU', countryName: 'Australia', flag: '🇦🇺', currencySymbol: 'A$', phoneCode: '+61', lang: 'en' },
  { countryCode: 'CA', countryName: 'Canada', flag: '🇨🇦', currencySymbol: 'C$', phoneCode: '+1', lang: 'en' },
  { countryCode: 'SG', countryName: 'Singapore', flag: '🇸🇬', currencySymbol: 'S$', phoneCode: '+65', lang: 'en' },
  { countryCode: 'ID', countryName: 'Indonesia', flag: '🇮🇩', currencySymbol: 'Rp', phoneCode: '+62', lang: 'id' },
  { countryCode: 'MX', countryName: 'Mexico', flag: '🇲🇽', currencySymbol: 'MX$', phoneCode: '+52', lang: 'es' },
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
