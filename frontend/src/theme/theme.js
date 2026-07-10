// FuelTrack LK design tokens
// Palette derived from the reference UI kit: warm coral/red primary,
// cream background, soft pink tints for secondary surfaces.

export const colors = {
  // Brand
  primary: '#F2655C',        // main coral-red (buttons, active tab, headers)
  primaryDark: '#C0392B',    // deep red (promo cards, gradients)
  primaryLight: '#FBA9A2',   // light coral (secondary buttons, chips)
  primaryTint: '#FDEDEB',    // very light pink tint (cards, pills, badges)

  // Backgrounds
  background: '#FFFFFF',
  backgroundCream: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F6F6F8',

  // Text
  textPrimary: '#1E1B1B',
  textSecondary: '#8A8A8E',
  textMuted: '#B7B5B8',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#3BB273',
  warning: '#F2A93B',
  danger: '#E6483C',

  // Queue status colors
  queueLow: '#3BB273',
  queueMedium: '#F2A93B',
  queueHigh: '#E6483C',

  // Borders / dividers
  border: '#F0EBEA',
  inputBackground: '#F7F4F3',

  // Misc
  black: '#000000',
  white: '#FFFFFF',
  overlay: 'rgba(20,12,12,0.55)',
};

export const fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 100,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: '#F2655C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
};

export default { colors, fonts, fontSizes, spacing, radii, shadow };
