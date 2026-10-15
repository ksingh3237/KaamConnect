// KaamConnect Theme Tokens
// Matches exact Stitch Design Tokens
import { Platform, TextStyle } from 'react-native';

export const Colors = {
  // Tricity Emerald Primary
  primary: '#00B074',
  primaryDark: '#006C46',
  primaryLight: '#E6F7F0',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E6F7F0',
  onPrimaryContainer: '#003A23',

  // Amber Flare Secondary
  secondary: '#F59E0B',
  secondaryDark: '#92400E',
  secondaryLight: '#FEF3C7',
  onSecondary: '#FFFFFF',

  // Verified Azur Tertiary
  tertiary: '#0284C7',
  tertiaryDark: '#0369A1',
  tertiaryLight: '#E0F2FE',
  onTertiary: '#FFFFFF',

  // Surface & Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',

  // Typography Colors (dark enough to read outdoors in sunlight; avoid the pale #94A3B8 for text)
  textMain: '#111C2D',
  textMuted: '#475569',
  textSubtle: '#64748B',

  // System
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5'
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

// Readable type scale: no essential text under 13px, body 14-15px.
export const Type = {
  hero: { fontSize: 24, fontWeight: '800' } as TextStyle,
  heading: { fontSize: 18, fontWeight: '700' } as TextStyle,
  title: { fontSize: 15, fontWeight: '700' } as TextStyle,
  body: { fontSize: 14, lineHeight: 20 } as TextStyle,
  caption: { fontSize: 13, fontWeight: '600' } as TextStyle,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999
};

// Web only: hides the browser focus ring on inputs whose wrapper already shows a focus state.
// 'none' is valid CSS for react-native-web but missing from React Native's style types.
export const noFocusRing = (Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as TextStyle;
