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

// Export colors for convenience
export { lightColors, darkColors };
export type { LightColors, DarkColors };

