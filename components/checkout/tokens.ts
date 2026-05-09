/**
 * Checkout design tokens.
 *
 * One spacing/radius/typography source of truth. Other checkout components
 * pull from here so the cart, modal, and success screens share the same
 * rhythm and never disagree on a magic number.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  input: 12,
  button: 14,
  card: 16,
  pill: 999,
} as const;

export const typography = {
  hero: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 17, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.2 },
  totalAmount: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.4 },
} as const;

export const animation = {
  fast: 160,
  base: 220,
  slow: 320,
} as const;

export const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 } as const;
export const MIN_TOUCH = 44;

export type ColorsLike = Record<string, any>;
