'use client';

import React, { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
});

const listeners = new Set<() => void>();

function readClientTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('pati-kalbi-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeTheme(callback: () => void) {
  listeners.add(callback);
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => callback();
  mq.addEventListener('change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(callback);
    mq.removeEventListener('change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<ThemeMode>(
    subscribeTheme,
    readClientTheme,
    () => 'light'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode = readClientTheme() === 'dark' ? 'light' : 'dark';
    window.localStorage.setItem('pati-kalbi-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    listeners.forEach((l) => l());
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

