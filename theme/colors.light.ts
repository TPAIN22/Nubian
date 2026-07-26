/**
 * Light theme — semantic colour tokens.
 *
 * Read this file as a set of *decisions*, not colours. When a screen needs a
 * colour it should be able to name what the colour is for (`colors.text.muted`,
 * `colors.sale`) rather than what it looks like. Raw ramps live in
 * `theme/palette.ts` and must not be imported outside this file.
 *
 * Surface hierarchy (this is the change that makes the app feel modern):
 *   background / canvas  → light grey page canvas
 *   surface / card       → white, sits *on* the canvas
 *   surfaceRaised        → white + shadow, sits on a card
 *
 * Every legacy key (`text.gray`, `bottons.btnPrimary`, `borderDark`, …) is kept
 * and re-pointed at the new ramp so no existing screen breaks while it is
 * migrated to the semantic names.
 */
import { gold, green, teal, neutral, status, decorative } from './palette';

export const lightColors = {
  /* ---------------- Brand ---------------- */
  primary: gold[600],
  primaryStrong: gold[700],
  primaryPressed: gold[700],
  primaryDark: gold[800],
  /** Tint background for selected/active states on a white card. */
  primarySoft: gold[50],
  primarySofter: gold[100],
  /** Text/icon colour that sits on top of `primary`. */
  onPrimary: neutral[0],

  secondary: green[600],
  secondaryStrong: green[700],
  secondarySoft: green[50],
  onSecondary: neutral[0],

  accent: teal[500],
  accentStrong: teal[600],
  accentSoft: teal[50],
  onAccent: neutral[0],

  /* ---------------- Surfaces ---------------- */
  /** Page canvas. Never white — white is reserved for cards. */
  background: neutral[50],
  canvas: neutral[50],
  /** White chrome: headers, tab bar, sheets, image wells. */
  surface: neutral[0],
  /** A step down from a card — inset rows, image placeholders, disabled fills. */
  surfaceMuted: neutral[100],
  /** A step up from a card — floating pills over imagery. */
  surfaceRaised: neutral[0],
  /** Recessed wells (search field on a card, quantity stepper track). */
  surfaceSunken: neutral[100],
  secondaryBackground: neutral[100],

  cardBackground: neutral[0],
  card: neutral[0],
  cardMuted: neutral[25],

  darkBackground: neutral[900],

  /* ---------------- Text ----------------
   * Neutral, never brand-green. Contrast against the white card:
   *   title 15.8:1 · body 7.6:1 · muted 5.2:1 · subtle 2.6:1 (decorative only)
   */
  text: {
    /** Headlines and anything that must be read first. */
    primary: neutral[900],
    title: neutral[900],
    dark: neutral[900],
    darkGray: neutral[800],
    /** Default body copy. */
    gray: neutral[800],
    body: neutral[600],
    secondary: neutral[600],
    /** Supporting copy, metadata, merchant names. */
    muted: neutral[500],
    tertiary: neutral[500],
    mediumGray: neutral[500],
    /** De-emphasised: struck-through prices, timestamps, empty glyphs. */
    subtle: neutral[400],
    lightGray: neutral[400],
    veryLightGray: neutral[400],
    placeholder: neutral[400],
    disabled: neutral[300],

    accent: gold[700],
    link: teal[600],
    price: neutral[900],
    inverse: neutral[0],
    onPrimary: neutral[0],
    white: '#FFFFFF',
    black: '#000000',
  },

  /* ---------------- Neutral ramp ---------------- */
  gray: {
    '50': neutral[50],
    '100': neutral[100],
    '200': neutral[200],
    '300': neutral[300],
    '400': neutral[400],
    '500': neutral[500],
    '600': neutral[600],
    '700': neutral[700],
    '800': neutral[800],
    '900': neutral[900],
  },

  /* ---------------- Buttons (legacy alias) ---------------- */
  bottons: {
    btnPrimary: gold[600],
    btnSecondary: green[600],
    btnDisabled: neutral[200],
  },
  buttonDisabled: neutral[200],
  buttonDisabledText: neutral[400],

  /* ---------------- Status ---------------- */
  success: status.success,
  successSoft: status.successSoft,
  successStrong: status.successStrong,
  warning: status.warning,
  warningSoft: status.warningSoft,
  warningStrong: status.warningStrong,
  error: status.error,
  errorSoft: status.errorSoft,
  errorStrong: status.errorStrong,
  danger: status.error,
  info: status.info,
  infoSoft: status.infoSoft,
  infoStrong: status.infoStrong,
  /** Discount / urgency. Distinct from `error` so a sale never reads as a fault. */
  sale: status.sale,
  saleSoft: status.saleSoft,
  rating: status.rating,

  /* ---------------- Borders ---------------- */
  /** Default 1px card/input outline. */
  border: neutral[200],
  /** Barely-there separators inside a card. */
  borderLight: neutral[100],
  borderSubtle: neutral[100],
  borderMedium: neutral[300],
  borderStrong: neutral[300],
  borderDark: neutral[400],
  borderFocus: gold[500],
  divider: neutral[100],

  /* ---------------- Overlay & shadow ---------------- */
  shadow: '#0B1220',
  overlay: 'rgba(11,18,32,0.32)',
  overlayDark: 'rgba(11,18,32,0.58)',
  overlayLight: 'rgba(11,18,32,0.06)',
  /** Gradient foot under hero imagery so white text stays legible. */
  scrim: 'rgba(11,18,32,0.55)',

  /* ---------------- Component-specific ---------------- */
  skeleton: neutral[200],
  skeletonHighlight: neutral[100],
  tabBar: neutral[0],
  tabBarActive: gold[600],
  tabBarInactive: neutral[400],
  /** Neutral well behind a product photo while it decodes. */
  imagePlaceholder: neutral[100],

  /* ---------------- Decorative ---------------- */
  gold: gold[500],
  teal: teal[500],
  green: green[600],
  orange: decorative.orange,
  purple: decorative.purple,
  cyan: decorative.cyan,
  lime: decorative.lime,
  yellow: decorative.yellow,
  pink: decorative.pink,
  indigo: decorative.indigo,
};

export type LightColors = typeof lightColors;
