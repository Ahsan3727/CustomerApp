// theme.js — updated with GrocerEase v3 tokens (basil, apricot, chili, ink, etc.)
// All original keys are preserved for backward compatibility.

export const Colors = {
  // ---- original primary green scale (untouched) ----
  primary50: '#f0fdf4',
  primary100: '#dcfce7',
  primary200: '#bbf7d0',
  primary300: '#86efac',
  primary400: '#4ade80',
  primary500: '#22c55e',
  primary600: '#16a34a',
  primary700: '#15803d',
  primary800: '#166534',
  primary900: '#14532d',

  // ---- original utility colours ----
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  red: '#ef4444',
  red50: '#fef2f2',
  amber: '#f59e0b',
  amber50: '#fffbeb',
  amber600: '#d97706',
  blue: '#3b82f6',
  blue50: '#eff6ff',
  blue600: '#2563eb',
  purple: '#8b5cf6',
  purple50: '#f5f3ff',
  teal: '#0d9488',
  teal50: '#f0fdfa',

  // ======== NEW: GrocerEase v3 tokens ========
  basil: '#1B7A4F',
  basilDark: '#0F5233',
  basilLight: '#EAF6EF',
  apricot: '#E8823A',
  apricotDark: '#C96A26',
  apricotLight: '#FDEEE1',
  chili: '#D64545',
  chiliLight: '#FBEAEA',
  linen: '#FAF7F2',       // main screen background
  ink: '#1B1D22',
  inkMuted: '#6B7280',
  border: '#ECE6DC',
  star: '#F5A623',
  sage: '#DCE9E0',

  // ---- aliases to keep old component imports working ----
  // (if any component still imports Colors.primary, Colors.accent, etc.)
  primary: '#1B7A4F',            // maps to basil
  primaryDark: '#0F5233',        // maps to basilDark
  primaryLight: '#EAF6EF',       // maps to basilLight
  accent: '#E8823A',             // maps to apricot
  lightGray: '#F3F4F6',          // keep if used
  black: '#1B1D22',              // maps to ink
  gray: '#64748b',               // keep if used (alias for gray500)
};

export const Fonts = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
  },
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extrabold: { fontWeight: '800' },
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 5,
  },
};