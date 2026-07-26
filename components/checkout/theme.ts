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

  /**
   * Primary call-to-action (Place order / Save address). A high-contrast brand
   * green so the button is unmistakably visible in both themes — never resolved
   * through an optional token that could go missing and leave the CTA invisible.
   */
  cta: string;
  ctaText: string;
  ctaDisabled: string;
  ctaDisabledText: string;

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
      // Now mapped onto the semantic surface ladder: `surface` is the grey page
      // canvas and `card` is white, which is what gives checkout the same
      // card-on-canvas depth as the rest of the app.
      surface: c.background,
      surfaceMuted: c.surfaceMuted,
      card: c.cardBackground,
      cardElevated: c.surfaceRaised,
      border: c.border,
      borderStrong: c.borderStrong,
      divider: c.divider,

      textPrimary: c.text.title,
      textSecondary: c.text.body,
      textTertiary: c.text.muted,
      textInverse: c.text.inverse,

      accent: c.primary,
      accentSoft: c.primarySoft,
      accentText: c.primaryStrong,

      // The one primary CTA treatment, shared with the `Button` kit: brand-gold
      // fill with the theme's on-primary ink (white in light, near-black in
      // dark). Hardcoding a colour here is what let the checkout CTA drift out
      // of step with every other button in the app.
      cta: c.primary,
      ctaText: c.onPrimary,
      ctaDisabled: c.buttonDisabled,
      ctaDisabledText: c.buttonDisabledText,

      success: c.success,
      successSoft: c.successSoft,
      warning: c.warning,
      warningSoft: c.warningSoft,
      error: c.error,
      errorSoft: c.errorSoft,

      overlay: c.overlayDark,
      isDark,
    }),
    [c, isDark],
  );
}

export { withAlpha };
