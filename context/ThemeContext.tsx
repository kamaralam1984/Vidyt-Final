'use client';

import React, { createContext, useContext, useState } from 'react';

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const cycleTheme = () => {
    setTheme(prev => CYCLE[(CYCLE.indexOf(prev) + 1) % CYCLE.length]);
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
