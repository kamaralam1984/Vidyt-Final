'use client';

import React, { createContext, useContext, useState } from 'react';

export const SUPPORTED_LOCALES = ['en', 'hi', 'ar', 'es', 'fr', 'de', 'pt', 'zh'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'en', setLocale: () => {} });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
