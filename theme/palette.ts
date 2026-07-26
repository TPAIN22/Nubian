/**
 * Raw colour ramps — the only file in the app that may contain a bare hex.
 *
 * Nothing here is semantic: `gold[600]` is a colour, `colors.primary` is a
 * decision. Screens must never import this file; they read the semantic tokens
 * from `theme/colors.light.ts` / `colors.dark.ts` via `useColors()`.
 *
 * The three brand ramps are tuned so that:
 *   - gold[600]  carries white text (≈4:1) and reads as premium, not yellow
 *   - green[600] carries white text (≈4.4:1) and reads modern, not olive
 *   - teal[500]  stays vivid enough to work as a highlight next to gold
 */

/**
 * Keeps the key names for autocomplete while widening every value to `string`.
 *
 * Without this, `as const` would make each swatch a literal type, and any
 * downstream `colors.primaryDark || colors.primary` fallback would narrow to
 * `never` — TypeScript knows a non-empty string literal is always truthy.
 */
const swatches = <K extends PropertyKey>(ramp: Record<K, string>): Record<K, string> => ramp;

/* ---------------- Brand: Nubian Gold (primary) ---------------- */
export const gold = swatches({
  50: '#FDF9F0',
  100: '#F9EFD6',
  200: '#F1DDA8',
  300: '#E7C673',
  400: '#D9AC46',
  500: '#C4912A',
  600: '#A97C1E', // primary CTA fill
  700: '#8A6417',
  800: '#6C4E14',
  900: '#4B360F',
});

/* ---------------- Brand: Modern Green (secondary) ---------------- */
export const green = swatches({
  50: '#EAF7F1',
  100: '#CFEDE0',
  200: '#9EDBC2',
  300: '#63C4A0',
  400: '#2CAA7D',
  500: '#12946A',
  600: '#0E8A5F',
  700: '#0A6B4A',
  800: '#08543A',
  900: '#063A28',
});

/* ---------------- Brand: Fresh Teal (accent) ---------------- */
export const teal = swatches({
  50: '#E6F7F9',
  100: '#C6EDF1',
  200: '#8FDCE4',
  300: '#4FC5D2',
  400: '#1FADBC',
  500: '#0E9AA7',
  600: '#0B8290',
  700: '#0A6874',
  800: '#08525C',
  900: '#063A42',
});

/* ---------------- Neutrals ----------------
 * A cool-but-not-blue slate ramp. `50` is the app canvas; white is reserved
 * for cards so the elevation hierarchy is readable without heavy shadows.
 */
export const neutral = swatches({
  0: '#FFFFFF',
  25: '#FAFBFC',
  50: '#F4F6F9', // app canvas
  100: '#EDEFF3',
  200: '#E1E5EB',
  300: '#CBD2DB',
  400: '#9AA4B2',
  500: '#6B7480',
  600: '#4E5661',
  700: '#374049',
  800: '#232A32',
  900: '#131820',
  950: '#0B0F15',
});

/* ---------------- Dark-mode surfaces ----------------
 * Warm-neutral rather than pure black so gold doesn't turn muddy.
 */
export const dark = swatches({
  canvas: '#0E1418',
  surface: '#141C21',
  card: '#1A242A',
  cardRaised: '#213038',
  border: '#2A363E',
  borderStrong: '#37454F',
});

/* ---------------- Status ---------------- */
export const status = swatches({
  success: '#12A150',
  successSoft: '#E7F7EE',
  successStrong: '#0B7A3C',

  warning: '#E08600',
  warningSoft: '#FEF4E3',
  warningStrong: '#B36A00',

  error: '#DC2626',
  errorSoft: '#FDECEC',
  errorStrong: '#B01B1B',

  info: '#2563EB',
  infoSoft: '#E9EFFD',
  infoStrong: '#1D4ED8',

  /** Discounts / urgency. Deliberately not the same red as `error`. */
  sale: '#E23744',
  saleSoft: '#FDEBEC',

  /** Star ratings. */
  rating: '#F5A524',
});

/* ---------------- Decorative accents ----------------
 * For category chips, illustration fills and marketing surfaces only —
 * never for text or interactive state.
 */
export const decorative = swatches({
  orange: '#F97316',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  yellow: '#FACC15',
  pink: '#EC4899',
  indigo: '#6366F1',
});
