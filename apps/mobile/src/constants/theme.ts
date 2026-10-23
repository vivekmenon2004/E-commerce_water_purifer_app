/**
 * Calinfco Water Purifier - Mobile Design Tokens
 * Professional Pure Water E-Commerce Design System
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Brand Water Palette
    primary: '#0077B6',       // Pure Calinfco Blue
    primaryDark: '#023E8A',   // Deep Ocean
    primaryLight: '#00B4D8',  // Azure Flow
    primaryMuted: '#E0F2FE',  // Crystal Tint
    accent: '#0096C7',        // Cyan Highlight

    // Neutrals & Surfaces
    text: '#0F172A',          // Slate Dark
    textSecondary: '#64748B', // Cool Grey
    textMuted: '#94A3B8',     // Subdued Grey
    background: '#F8FAFC',    // Soft Pure White
    backgroundElement: '#FFFFFF', // Card Surface
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',

    // Pure Water & Maintenance Status Indicators
    tdsOptimal: '#10B981',    // TDS 50-150 ppm (Pristine)
    tdsAcceptable: '#3B82F6', // TDS 150-300 ppm (Clean)
    tdsWarning: '#F59E0B',    // TDS 300-500 ppm (Filter change due)
    tdsCritical: '#EF4444',   // TDS > 500 ppm (Unsafe / Emergency)
    badgeBackground: '#ECFDF5',
  },
  dark: {
    // Brand Water Palette
    primary: '#00B4D8',
    primaryDark: '#0077B6',
    primaryLight: '#90E0EF',
    primaryMuted: '#0B2545',
    accent: '#48CAE4',

    // Neutrals & Surfaces
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#0B132B',    // Deep Marine Night
    backgroundElement: '#1C2541', // Card Surface Dark
    backgroundSelected: '#2E3B55',
    border: '#1E293B',

    // Pure Water & Maintenance Status Indicators
    tdsOptimal: '#34D399',
    tdsAcceptable: '#60A5FA',
    tdsWarning: '#FBBF24',
    tdsCritical: '#F87171',
    badgeBackground: '#064E3B',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
