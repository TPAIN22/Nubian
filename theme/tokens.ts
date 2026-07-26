/**
 * Shared design tokens — one spacing/radius/typography/elevation source of truth
 * for the whole app (home, product, checkout, auth, profile, …) so screens share
 * the same rhythm and never disagree on a magic number.
 *
 * Rules of thumb when reaching for a token:
 *   - Vertical/horizontal gaps            → `spacing`
 *   - Corner rounding                     → `radius`
 *   - Any text style                      → `typography`
 *   - Any shadow / Android elevation      → `elevation`
 *   - Icon glyph size                     → `iconSize`
 *   - Button/control height               → `controlHeight`
 *
 * Anything not expressible with these is a signal the design is drifting.
 */

/* ------------------------------------------------------------------ *
 * Spacing — strict 8pt system (with 4pt half-steps for dense controls)
 * ------------------------------------------------------------------ */

export const spacing = {
  none: 0,
  /** 2 — hairline optical nudges only (badge insets, icon centering). */
  xxs: 2,
  /** 4 */
  xs: 4,
  /** 8 */
  sm: 8,
  /** 12 */
  md: 12,
  /** 16 — the default gutter. Screen edges, card padding. */
  base: 12,
  /** 20 */
  lg: 16,
  /** 24 — gap between distinct content blocks. */
  xl: 20,
  /** 32 — gap between major sections. */
  xxl: 28,
  /** 40 */
  xxxl: 36,
  /** 48 — hero / empty-state breathing room. */
  huge: 44,
} as const;

/** Horizontal padding every screen and rail aligns to. */
export const SCREEN_PADDING = spacing.base;

/* ------------------------------------------------------------------ *
 * Radius
 * ------------------------------------------------------------------ */

export const radius = {
  none: 0,
  xs: 6,
  sm: 10,
  /** 12 */
  md: 12,
  /** 14 — inputs. */
  input: 14,
  /** 16 — buttons. */
  button: 16,
  /** 16 — images inside cards. */
  image: 16,
  /** 18 — cards. */
  card: 16,
  /** 20 — large surfaces / hero blocks. */
  lg: 20,
  /** 24 — bottom sheets and modals. */
  sheet: 24,
  /** 28 */
  xl: 28,
  /** Fully rounded — chips, pills, avatars, badges. */
  pill: 999,
} as const;

/* ------------------------------------------------------------------ *
 * Typography
 *
 * One ladder, no in-between sizes. Line heights are ~1.3–1.45× so dense
 * commerce copy (product names, prices) stays scannable, and letter-spacing
 * tightens as size grows the way system UI fonts expect.
 * ------------------------------------------------------------------ */

export const typography = {
  /** 32 — one-off marketing/hero moments (onboarding, order success). */
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700' as const, letterSpacing: -0.6 },
  /** 28 — screen hero. */
  hero: { fontSize: 28, lineHeight: 34, fontWeight: '600' as const, letterSpacing: -0.5 },
  /** 24 — page title. */
  pageTitle: { fontSize: 24, lineHeight: 30, fontWeight: '600' as const, letterSpacing: -0.4 },
  /** 22 — kept for callers that already use `title`. */
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const, letterSpacing: -0.3 },
  /** 20 — section header ("Trending now"). */
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const, letterSpacing: -0.3 },
  /** 17 — sub-section / row heading. */
  subtitle: { fontSize: 17, lineHeight: 23, fontWeight: '500' as const, letterSpacing: -0.2 },
  /** 15 — product/card title. */
  cardTitle: { fontSize: 15, lineHeight: 20, fontWeight: '500' as const, letterSpacing: -0.1 },
  /** 15 — default reading size. */
  body: { fontSize: 15, lineHeight: 22, fontWeight: '300' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '500' as const },
  /** 14 — secondary reading size, dense lists. */
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  bodySmallStrong: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  /** 13 — supporting copy. */
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '300' as const },
  captionStrong: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  /** 12 — field labels, chips, meta. */
  label: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.2 },
  /** 11 — badges and the smallest legible meta. */
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const, letterSpacing: 0.2 },
  /** 10 — counters only (cart badge). Never body copy. */
  overline: { fontSize: 10, lineHeight: 13, fontWeight: '700' as const, letterSpacing: 0.4 },

  /* Price ladder — money is the loudest thing on a commerce surface. */
  /** 24 — checkout grand total. */
  totalAmount: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, letterSpacing: -0.4 },
  /** 26 — product detail price. */
  priceHero: { fontSize: 26, lineHeight: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  /** 17 — price on a card. */
  price: { fontSize: 17, lineHeight: 22, fontWeight: '500' as const, letterSpacing: -0.3 },
  /** 15 — price in a dense list row. */
  priceSmall: { fontSize: 15, lineHeight: 20, fontWeight: '400' as const, letterSpacing: -0.2 },
  /** 13 — struck-through was-price. */
  priceStrike: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '300' as const,
    textDecorationLine: 'line-through' as const,
  },
} as const;

/* ------------------------------------------------------------------ *
 * Elevation
 *
 * Modern soft shadows: wide radius, low opacity, cool-tinted rather than
 * pure black, so cards lift off the canvas without a grey halo. Android
 * gets a matching `elevation` because it ignores the iOS shadow fields.
 * ------------------------------------------------------------------ */

const SHADOW_TINT = '#0B1220';

export const elevation = {
  /** Flat — bordered surfaces that shouldn't lift. */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  /** Resting card in a dense grid. Barely there. */
  xs: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  /** Default product card / list card. */
  sm: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Raised card, primary button, floating chip. */
  md: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  /** Sticky footers, headers, FABs. */
  lg: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 8,
  },
  /** Bottom sheets, modals. */
  xl: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 32,
    elevation: 16,
  },
} as const;

/** Upward shadow for sticky bottom bars (checkout CTA, add-to-cart). */
export const elevationUp = {
  shadowColor: SHADOW_TINT,
  shadowOffset: { width: 0, height: -6 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 12,
} as const;

/* ------------------------------------------------------------------ *
 * Icons & controls
 * ------------------------------------------------------------------ */

export const iconSize = {
  /** 14 — inline with caption text. */
  xs: 14,
  /** 16 — inline with body text, chevrons. */
  sm: 16,
  /** 20 — input adornments, list rows. */
  md: 20,
  /** 24 — headers, tab bar, primary actions. */
  lg: 24,
  /** 28 — emphasis. */
  xl: 28,
  /** 32 — empty-state / feature glyphs. */
  xxl: 32,
  /** 48 — illustration-scale. */
  hero: 48,
} as const;

/** Minimum height of any tappable control, by size. */
export const controlHeight = {
  /** 36 — compact chips/steppers inside dense rows. */
  sm: 36,
  /** 44 — default; also the accessibility minimum. */
  md: 44,
  /** 52 — primary CTA. */
  lg: 52,
  /** 56 — hero CTA (sticky add-to-cart, place order). */
  xl: 56,
} as const;

/** Square side of an icon-only button, by size. */
export const iconButtonSize = {
  sm: 32,
  md: 40,
  lg: 44,
} as const;

/* ------------------------------------------------------------------ *
 * Motion
 *
 * Fast and restrained. Anything above `slow` reads as lag, not polish.
 * ------------------------------------------------------------------ */

export const animation = {
  /** 120 — press feedback. */
  instant: 120,
  /** 160 — micro state changes. */
  fast: 160,
  /** 220 — the default. */
  base: 220,
  /** 320 — entrances, sheets. */
  slow: 320,
} as const;

/** Overdamped spring for press-scale — settles, never bounces. */
export const pressSpring = { damping: 22, stiffness: 340, mass: 0.7 } as const;

/** How far a pressable shrinks on press-in. */
export const pressScale = {
  /** Large surfaces (cards, banners) — a subtle nudge. */
  card: 0.975,
  /** Buttons and small controls. */
  button: 0.96,
  /** Icon-only taps. */
  icon: 0.9,
} as const;

/* ------------------------------------------------------------------ *
 * Touch targets
 * ------------------------------------------------------------------ */

export const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 } as const;
export const MIN_TOUCH = 44;

/* ------------------------------------------------------------------ *
 * Layout
 * ------------------------------------------------------------------ */

export const layout = {
  /** Product image aspect ratio on cards — slightly tall, like Noon/Amazon. */
  productImageRatio: 1,
  /** Product image aspect ratio on the details gallery. */
  productHeroRatio: 1,
  /** Hero banner ratio. */
  bannerRatio: 16 / 9,
  /** Gap between cards in a grid or rail. */
  gridGap: spacing.md,
  /** Hairline separator thickness that survives high-density screens. */
  hairline: 1,
} as const;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

/**
 * Appends an alpha channel to a 6-digit hex. Returns the input untouched for
 * `rgba()`/named colours so callers can pass any theme value safely.
 */
export const withAlpha = (color: string, alpha: number): string => {
  if (!color?.startsWith('#') || color.length !== 7) return color;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${a}`;
};

export type ColorsLike = Record<string, any>;
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type TypographyVariant = keyof typeof typography;
export type ElevationLevel = keyof typeof elevation;
