import { lightColors, LightColors } from './colors.light';
import { darkColors, DarkColors } from './colors.dark';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: LightColors | DarkColors;
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
};

export const getTheme = (mode: ThemeMode): Theme => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Colours
export { lightColors, darkColors };
export type { LightColors, DarkColors };

// Design tokens — spacing, radius, typography, elevation, motion, sizing.
// Re-exported here so a screen only ever needs `@/theme`.
export {
  spacing,
  SCREEN_PADDING,
  radius,
  typography,
  elevation,
  elevationUp,
  iconSize,
  controlHeight,
  iconButtonSize,
  animation,
  pressSpring,
  pressScale,
  layout,
  withAlpha,
  HIT_SLOP,
  MIN_TOUCH,
} from './tokens';
export type {
  ColorsLike,
  Spacing,
  Radius,
  TypographyVariant,
  ElevationLevel,
} from './tokens';
