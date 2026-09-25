import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

export interface AppearanceSettings {
  theme: Theme;
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  compactMode: boolean;
  showAnimations: boolean;
  language: string;
}

const defaultAppearance: AppearanceSettings = {
  theme: 'light',
  primaryColor: '#003366',
  fontSize: 'medium',
  compactMode: false,
  showAnimations: true,
  language: 'en',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  appearance: AppearanceSettings;
  setAppearance: (settings: Partial<AppearanceSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [appearance, setAppearanceState] = useState<AppearanceSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('appearance-settings') || '{}');
        return { ...defaultAppearance, ...stored };
      } catch {
        return defaultAppearance;
      }
    }
    return defaultAppearance;
  });

  const { theme } = appearance;

  useEffect(() => {
    if (theme === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      document.documentElement.classList.toggle('dark', mq.matches);
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    const root = document.documentElement;
    root.style.setProperty('--primary-color', appearance.primaryColor);
    root.classList.toggle('compact-mode', appearance.compactMode);
    root.classList.toggle('reduce-motion', !appearance.showAnimations);
    root.dataset.fontSize = appearance.fontSize;
    localStorage.setItem('appearance-settings', JSON.stringify(appearance));
  }, [appearance]);

  const setTheme = (t: Theme) => {
    setAppearanceState((current) => ({ ...current, theme: t }));
  };

  const setAppearance = (settings: Partial<AppearanceSettings>) => {
    setAppearanceState((current) => ({ ...current, ...settings }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, appearance, setAppearance }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
