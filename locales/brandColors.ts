/**
 * Static colour access for module-scope `StyleSheet.create` calls that run
 * before a React tree exists and therefore cannot use `useColors()`.
 *
 * This is now a straight alias of the light theme rather than a second,
 * hand-maintained palette — the two used to drift (different golds, a green
 * body-text colour, a white page canvas) and that drift is a large part of why
 * the app read as inconsistent.
 *
 * Prefer `useColors()` inside components. Reach for this only in static
 * stylesheets, and only for values that never change with the theme.
 */
import { lightColors } from '@/theme/colors.light';

const Colors = lightColors;

export default Colors;
