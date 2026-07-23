/**
 * Variant → visual language mapping.
 *
 * Every colour is derived from the app's theme tokens (`theme/colors.*.ts`) —
 * nothing is hardcoded — so the cards follow light/dark automatically once
 * `ThemeProvider` starts returning the dark palette again. Tints are produced
 * by compositing the token colour at low alpha over the card surface, which
 * keeps contrast correct on both backgrounds.
 */

import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { radius, spacing } from '@/theme/tokens';
import type { NotificationPriority, NotificationVariant } from './types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Loose shape so this works with either the light or the dark palette. */
export type ThemeColors = {
  cardBackground: string;
  background: string;
  surface: string;
  border: string;
  shadow: string;
  primary: string;
  accent: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  text: { secondary: string; tertiary: string; white: string };
  [key: string]: any;
};

/**
 * Apply an alpha channel to a theme colour.
 * Accepts `#RGB`, `#RRGGBB`, `#RRGGBBAA` and passes anything else through
 * untouched (e.g. the `rgba(...)` overlay tokens).
 */
export function withAlpha(color: string, alpha: number): string {
  if (typeof color !== 'string' || !color.startsWith('#')) return color;
  const hex = color.slice(1);
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex.slice(0, 6);
  if (full.length !== 6) return color;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return color;
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export interface VariantVisuals {
  /** Icon glyph for the leading chip. */
  icon: IoniconName;
  /** Accent used by the rail, icon and CTA. */
  accent: string;
  /** Soft fill behind the icon. */
  chip: string;
  /** Hairline around the icon chip. */
  chipBorder: string;
  /** Whole-card wash — barely there, just enough to read as "this type". */
  wash: string;
  /** Card border. */
  border: string;
}

export function getVariantVisuals(
  variant: NotificationVariant,
  colors: ThemeColors
): VariantVisuals {
  const map: Record<NotificationVariant, { icon: IoniconName; accent: string }> = {
    success: { icon: 'checkmark-circle', accent: colors.success },
    error: { icon: 'alert-circle', accent: colors.error },
    warning: { icon: 'warning', accent: colors.warning },
    info: { icon: 'information-circle', accent: colors.info },
    // Order updates carry the brand accent — they're the notifications a
    // shopper cares most about, so they read as "from Nubian", not "a status".
    order: { icon: 'cube', accent: colors.primary },
    promo: { icon: 'sparkles', accent: colors.accent },
  };

  const { icon, accent } = map[variant] ?? map.info;

  return {
    icon,
    accent,
    chip: withAlpha(accent, 0.14),
    chipBorder: withAlpha(accent, 0.24),
    wash: withAlpha(accent, 0.05),
    border: withAlpha(accent, 0.22),
  };
}

export interface PriorityVisuals {
  /** Width of the leading accent rail. */
  railWidth: number;
  borderWidth: number;
  /** Android elevation / iOS shadow strength. */
  elevation: number;
  shadowOpacity: number;
  shadowRadius: number;
  /** Show the "Urgent" pill next to the title. */
  showBadge: boolean;
}

export function getPriorityVisuals(priority: NotificationPriority): PriorityVisuals {
  switch (priority) {
    case 'critical':
      return {
        railWidth: 6,
        borderWidth: 1.5,
        elevation: 14,
        shadowOpacity: 0.22,
        shadowRadius: 20,
        showBadge: true,
      };
    case 'high':
      return {
        railWidth: 4,
        borderWidth: 1,
        elevation: 10,
        shadowOpacity: 0.16,
        shadowRadius: 16,
        showBadge: false,
      };
    case 'low':
      return {
        railWidth: 3,
        borderWidth: 1,
        elevation: 5,
        shadowOpacity: 0.1,
        shadowRadius: 10,
        showBadge: false,
      };
    case 'normal':
    default:
      return {
        railWidth: 4,
        borderWidth: 1,
        elevation: 8,
        shadowOpacity: 0.13,
        shadowRadius: 14,
        showBadge: false,
      };
  }
}

/** Shared geometry so every notification piece agrees on its rhythm. */
export const NOTIFICATION_LAYOUT = {
  cardRadius: radius.card + 6,
  chipSize: 44,
  chipRadius: radius.pill,
  gap: spacing.md,
  paddingVertical: spacing.md + 2,
  paddingHorizontal: spacing.base - 2,
  stackGap: 10,
  /** Cards never grow past this on tablets. */
  maxWidth: 520,
  progressHeight: 3,
  /** Minimum accessible touch target (matches tokens.MIN_TOUCH). */
  minTouch: 44,
} as const;
