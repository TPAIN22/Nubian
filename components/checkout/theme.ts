/**
 * Semantic checkout palette derived from the active theme.
 *
 * Theme files store many legacy aliases; this hook flattens what the checkout
 * surfaces actually need so components don't rummage through `colors.text.*`
 * inline.
 */
import { useMemo } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

export type CheckoutPalette = {
  surface: string;
  surfaceMuted: string;
  card: string;
  cardElevated: string;
  border: string;
  borderStrong: string;
  divider: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  accent: string;
  accentSoft: string;
  accentText: string;

  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  error: string;
  errorSoft: string;

  overlay: string;
  isDark: boolean;
};

const withAlpha = (hex: string, alpha: number) => {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
};

export function useCheckoutTheme(): CheckoutPalette {
  const { theme, isDark } = useTheme();
  const c: any = theme.colors;

  return useMemo<CheckoutPalette>(
    () => ({
      surface: c.background,
      surfaceMuted: c.surface,
      card: c.cardBackground,
      cardElevated: isDark ? c.surface : c.background,
      border: isDark ? c.border : c.borderLight,
      borderStrong: isDark ? c.borderMedium : c.borderMedium,
      divider: isDark ? c.border : c.borderLight,

      textPrimary: isDark ? c.text.gray : c.text.darkGray,
      textSecondary: isDark ? c.text.mediumGray : c.text.mediumGray,
      textTertiary: isDark ? c.text.lightGray : c.text.veryLightGray,
      textInverse: c.text.white,

      accent: c.primary,
      accentSoft: withAlpha(c.primary, 0.1),
      accentText: c.primary,

      success: c.success,
      successSoft: withAlpha(c.success, 0.12),
      warning: c.warning,
      warningSoft: withAlpha(c.warning, 0.12),
      error: c.error,
      errorSoft: withAlpha(c.error, 0.1),

      overlay: c.overlayDark,
      isDark,
    }),
    [c, isDark],
  );
}

export { withAlpha };
