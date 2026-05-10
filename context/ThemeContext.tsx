'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light' | 'colorblind';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
  cycleTheme: () => {},
});

const CYCLE: ThemeMode[] = ['dark', 'light', 'colorblind'];
const STORAGE_KEY = 'vidyt_theme';

function isThemeMode(v: string | null): v is ThemeMode {
  return v === 'dark' || v === 'light' || v === 'colorblind';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  // Restore from localStorage on mount, falling back to whatever the no-flash
  // bootstrap script (in layout.tsx) already set on <html>.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isThemeMode(saved)) {
        setThemeState(saved);
        return;
      }
      const fromDom = document.documentElement.getAttribute('data-theme');
      if (isThemeMode(fromDom)) setThemeState(fromDom);
    } catch { /* storage may be blocked */ }
  }, []);

  // Apply data-theme to <html> + persist on every change. This is what makes
  // the [data-theme="light"] / [data-theme="colorblind"] CSS rules in globals.css
  // actually take effect.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme === 'light' ? 'light' : 'dark';
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore */ }
  }, [theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  const cycleTheme = () => {
    setThemeState(prev => CYCLE[(CYCLE.indexOf(prev) + 1) % CYCLE.length]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
