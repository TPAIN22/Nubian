/**
 * Dark theme — the same semantic contract as `colors.light.ts`, so any screen
 * built against the tokens works in either mode with no conditionals.
 *
 * Two adjustments vs. light, both standard for dark UI:
 *   - Brand colours move *up* the ramp (gold[400] not gold[600]) because a
 *     saturated mid-tone loses contrast against a dark canvas.
 *   - The surface ladder inverts: the canvas is darkest and each level of
 *     elevation gets *lighter*, which is how depth reads without shadows.
 *
 * The app currently renders light-only (see `providers/ThemeProvider`), but
 * this stays complete and correct so dark mode is a one-line switch.
 */
import { gold, green, teal, neutral, dark, status, decorative } from './palette';

export const darkColors = {
  /* ---------------- Brand ---------------- */
  primary: gold[400],
  primaryStrong: gold[300],
  primaryPressed: gold[500],
  primaryDark: gold[600],
  primarySoft: 'rgba(217,172,70,0.14)',
  primarySofter: 'rgba(217,172,70,0.08)',
  /** Dark ink on light gold reads far better than white-on-gold here. */
  onPrimary: neutral[950],

  secondary: green[400],
  secondaryStrong: green[300],
  secondarySoft: 'rgba(44,170,125,0.14)',
  onSecondary: neutral[950],

  accent: teal[300],
  accentStrong: teal[200],
  accentSoft: 'rgba(79,197,210,0.14)',
  onAccent: neutral[950],

  /* ---------------- Surfaces ---------------- */
  background: dark.canvas,
  canvas: dark.canvas,
  surface: dark.surface,
  surfaceMuted: dark.card,
  surfaceRaised: dark.cardRaised,
  surfaceSunken: '#0A1013',
  secondaryBackground: '#0A1013',

  cardBackground: dark.card,
  card: dark.card,
  cardMuted: dark.surface,

  darkBackground: dark.canvas,

  /* ---------------- Text ---------------- */
  text: {
    primary: '#F2F5F7',
    title: '#F2F5F7',
    dark: '#F2F5F7',
    darkGray: '#E4E9ED',
    gray: '#E4E9ED',
    body: '#C2CBD2',
    secondary: '#C2CBD2',
    muted: '#93A0A9',
    tertiary: '#93A0A9',
    mediumGray: '#93A0A9',
    subtle: '#6E7C86',
    lightGray: '#6E7C86',
    veryLightGray: '#6E7C86',
    placeholder: '#6E7C86',
    disabled: '#4A565E',

    accent: gold[300],
    link: teal[300],
    price: '#F2F5F7',
    inverse: neutral[950],
    onPrimary: neutral[950],
    white: '#FFFFFF',
    black: '#000000',
  },

  /* ---------------- Neutral ramp (inverted) ---------------- */
  gray: {
    '50': '#141C21',
    '100': '#1A242A',
    '200': '#213038',
    '300': '#2A363E',
    '400': '#6E7C86',
    '500': '#93A0A9',
    '600': '#C2CBD2',
    '700': '#E4E9ED',
    '800': '#F2F5F7',
    '900': '#FFFFFF',
  },

  /* ---------------- Buttons (legacy alias) ---------------- */
  bottons: {
    btnPrimary: gold[400],
    btnSecondary: green[400],
    btnDisabled: '#2A363E',
  },
  buttonDisabled: '#2A363E',
  buttonDisabledText: '#6E7C86',

  /* ---------------- Status ---------------- */
  success: '#2FBE70',
  successSoft: 'rgba(47,190,112,0.14)',
  successStrong: '#12A150',
  warning: '#F0A32E',
  warningSoft: 'rgba(240,163,46,0.14)',
  warningStrong: '#E08600',
  error: '#F26363',
  errorSoft: 'rgba(242,99,99,0.14)',
  errorStrong: status.error,
  danger: '#F26363',
  info: '#5B8DF6',
  infoSoft: 'rgba(91,141,246,0.14)',
  infoStrong: status.info,
  sale: '#FF5C68',
  saleSoft: 'rgba(255,92,104,0.14)',
  rating: '#F5B944',

  /* ---------------- Borders ---------------- */
  border: dark.border,
  borderLight: '#212C33',
  borderSubtle: '#212C33',
  borderMedium: dark.borderStrong,
  borderStrong: dark.borderStrong,
  borderDark: '#465661',
  borderFocus: gold[400],
  divider: '#212C33',

  /* ---------------- Overlay & shadow ---------------- */
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.55)',
  overlayDark: 'rgba(0,0,0,0.75)',
  overlayLight: 'rgba(0,0,0,0.3)',
  scrim: 'rgba(0,0,0,0.6)',

  /* ---------------- Component-specific ---------------- */
  skeleton: '#213038',
  skeletonHighlight: '#2A363E',
  tabBar: dark.surface,
  tabBarActive: gold[400],
  tabBarInactive: '#6E7C86',
  imagePlaceholder: '#213038',

  /* ---------------- Decorative ---------------- */
  gold: gold[400],
  teal: teal[300],
  green: green[400],
  orange: decorative.orange,
  purple: decorative.purple,
  cyan: decorative.cyan,
  lime: decorative.lime,
  yellow: decorative.yellow,
  pink: decorative.pink,
  indigo: decorative.indigo,
};

export type DarkColors = typeof darkColors;
