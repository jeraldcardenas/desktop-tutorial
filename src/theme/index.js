/**
 * Central design tokens for TalkQuest.
 * Bright, soft, playful, kid-friendly. Big touch targets, minimal text.
 */

export const colors = {
  // Warm, soft background — not overstimulating.
  background: '#FFF6E9',
  surface: '#FFFFFF',

  // Primary brand — friendly teal/blue.
  primary: '#4EC3C9',
  primaryDark: '#2DA7AD',

  // Action / "Done" — happy green.
  success: '#7BC96F',
  successDark: '#5FAE53',

  // "Skip" — gentle, low-pressure.
  neutral: '#F0E6D6',
  neutralDark: '#D8C9B3',

  // Accents used across themes.
  sunny: '#FFD166',
  coral: '#FF8C7A',
  grape: '#B79CED',
  sky: '#7EC8E3',

  text: '#3D3A36',
  textSoft: '#7A756E',
  textOnPrimary: '#FFFFFF',

  // Soft shadow tone.
  shadow: '#00000022',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
};

export const typography = {
  // Large, readable. Minimal text on screen but what's there is big.
  hero: { fontSize: 34, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800' },
  heading: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 18, fontWeight: '500' },
  caption: { fontSize: 15, fontWeight: '500' },
  button: { fontSize: 22, fontWeight: '800' },
};

export default { colors, spacing, radius, typography };
