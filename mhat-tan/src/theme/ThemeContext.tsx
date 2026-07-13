// Mhat Tan - Theme Context (Dark/Light/System)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './index';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  mode: 'system',
  setMode: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');

  const isDark = mode === 'system'
    ? systemScheme === 'dark'
    : mode === 'dark';

  const theme = isDark ? darkTheme : lightTheme;

  const value: ThemeContextValue = {
    theme,
    mode,
    setMode,
    isDark,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// Convenience hook: just the colors
export function useColors() {
  const { theme } = useTheme();
  return theme.colors;
}
