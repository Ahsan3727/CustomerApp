// Design tokens for CustomerApp.
//
// This file was MISSING entirely — only theme/theme.js existed, which
// exports a different, smaller palette (used by a handful of older screens
// that import from '../theme/theme' directly, e.g. RateScreen.js,
// AddAddressScreen.js). Nineteen other files — HomeScreen, CartScreen,
// ProfileScreen, ProductDetailScreen, SearchScreen, SettingsScreen,
// OrdersScreen, TrackOrderScreen, CheckoutScreen, ProductListScreen, and
// every shared component in components/ — import { Colors, Radius, Shadows,
// Fonts } from '../theme', which without this file cannot resolve to
// anything. That means the app could not be bundled/built at all.
//
// Every key below is one that's actually referenced somewhere in the
// codebase (grepped across all Colors./Radius./Shadows./Fonts. usages) so
// nothing here is a guess about what's needed — only about the exact hex
// values, which follow the warm-orange/green/red palette already visible in
// TrackOrderScreen.js's and OrderMapPicker.js's local Colors objects and the
// "GrocerEase green" comment in components/ToggleSwitch.js.

export const Colors = {
  // ---- Apricot (orange) — primary brand family ----
  primary: '#FF7F2A',
  accent: '#FF9800',
  apricot: '#FF7F2A',
  apricotDark: '#E8630F',
  apricotLight: '#FFE4D1',
  lightOrange: '#FFE4D1',
  orange500: '#FF7F2A',
  orange600: '#E8630F',
  heroBg: '#FF9F43',
  amber: '#F59E0B',

  // ---- Basil (green) — success / secondary ----
  basil: '#3F9142',
  basilDark: '#2A6B2D',
  basilLight: '#E3F3E3',
  green: '#16A34A',
  success: '#4CAF50',

  // ---- Chili (red) — error / danger ----
  chili: '#E5484D',
  chiliLight: '#FBDADA',
  error: '#E5484D',

  // ---- Text ----
  ink: '#3E2723',
  inkMuted: '#8B6F5E',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  black: '#212121',

  // ---- Backgrounds ----
  linen: '#FFF6F0',
  background: '#FFF6F0',
  cardBg: '#FFFFFF',
  bgTop: '#FFF6F0',
  bgBottom: '#FFEFE3',
  white: '#FFFFFF',

  // ---- Neutral grays ----
  gray: '#757575',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#9CA3AF',
  gray600: '#475569',
  gray700: '#334155',
  lightGray: '#E0E0E0',
  border: '#F0E4DA',

  warning: '#FFC107',
};

export const Radius = {
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  // Some files reference `medium` instead of `md` — keep both so neither call site breaks.
  medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 8 },
};

export const Fonts = {
  sizes: { xs: 11, sm: 13, md: 15, lg: 18, xl: 22 },
  medium: '500',
  semibold: '600',
  bold: '700',
};
