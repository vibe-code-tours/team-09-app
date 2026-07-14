// Mhat Tan - Design Tokens
// Based on .planning/sketches/themes/default.css

import { useColorScheme } from 'react-native';

// Category definitions (same in light/dark)
export type Category = 'money' | 'feelings' | 'work' | 'health' | 'ideas' | 'other';

export const CATEGORIES: Record<Category, { icon: string; label: string; color: string }> = {
  money:    { icon: '💰', label: 'Money',    color: '#4CAF50' },
  feelings: { icon: '😊', label: 'Feelings', color: '#E91E63' },
  work:     { icon: '💼', label: 'Work',     color: '#2196F3' },
  health:   { icon: '🏥', label: 'Health',   color: '#FF9800' },
  ideas:    { icon: '💡', label: 'Ideas',    color: '#9C27B0' },
  other:    { icon: '📝', label: 'Other',    color: '#607D8B' },
};

// Light theme
const lightColors = {
  primary: '#E91E63',
  primaryLight: '#FCE4EC',
  primaryDark: '#AD1457',
  accent: '#FF6F00',
  bg: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAFA',
  text: '#212121',
  textSecondary: '#666666',
  textMuted: '#9E9E9E',
  border: '#F0F0F0',
  divider: '#EEEEEE',
  danger: '#F44336',
  success: '#4CAF50',
  successLight: '#E8F5E9',
  overlay: 'rgba(0,0,0,0.5)',
};

// Dark theme
const darkColors = {
  primary: '#F06292',
  primaryLight: '#3D2C3E',
  primaryDark: '#EC407A',
  accent: '#FFB74D',
  bg: '#121212',
  surface: '#1E1E1E',
  surfaceAlt: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#757575',
  border: '#333333',
  divider: '#2A2A2A',
  danger: '#EF5350',
  success: '#66BB6A',
  successLight: '#1B3D1F',
  overlay: 'rgba(0,0,0,0.7)',
};

export type Colors = typeof lightColors;

export interface Theme {
  colors: Colors;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: lightColors,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  isDark: true,
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Border radius
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// Shadow presets (color applied per-theme)
export const createShadows = (isDark: boolean, primaryColor: string) => ({
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.4 : 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.5 : 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  primary: {
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

// Helper: format relative time
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Helper: format full date for header
export function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Helper: get greeting based on time of day
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return '🌅 Good Morning';
  if (hour < 17) return '☀️ Good Afternoon';
  return '🌙 Good Evening';
}
