import React, { useMemo } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Text as BaseText } from '@/components/ui/text';
import { typography, type TypographyVariant } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

type Tone =
  | 'title'
  | 'body'
  | 'muted'
  | 'subtle'
  | 'inverse'
  | 'primary'
  | 'accent'
  | 'success'
  | 'error'
  | 'warning'
  | 'sale';

export interface AppTextProps
  extends Omit<React.ComponentProps<typeof BaseText>, 'size' | 'bold'> {
  /** Slot on the type ladder. See `theme/tokens.ts`. */
  variant?: TypographyVariant;
  /** Semantic colour role. Defaults to `body`. */
  tone?: Tone;
  /** Override the variant's weight without leaving the ladder. */
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

/**
 * The app's only text component.
 *
 * Two things it fixes over calling `<Text style={{fontSize: 13}}>` directly:
 *
 *  1. Sizes come from the type ladder, so there is no drift into 13.5/14/15 for
 *     what is conceptually the same role.
 *  2. Cairo ships as Regular + Bold only, so a `fontWeight: '600'` is silently
 *     rendered as Regular on Android. This maps any weight ≥ 600 onto the Bold
 *     face, which is why headings used to look flat.
 */
export const AppText = React.memo(function AppText({
  variant = 'body',
  tone = 'body',
  weight,
  align,
  style,
  ...rest
}: AppTextProps) {
  const colors = useColors();

  const spec = typography[variant] as TextStyle;
  const resolvedWeight = weight ?? spec.fontWeight;
  // Cairo has no variable weights — anything semi-bold or above must use the
  // Bold face or it renders at Regular.
  const useBoldFace =
    resolvedWeight === 'bold' ||
    (typeof resolvedWeight === 'string' && Number(resolvedWeight) >= 600);

  const toneColor = useMemo<string>(() => {
    switch (tone) {
      case 'title':
        return colors.text.title;
      case 'muted':
        return colors.text.muted;
      case 'subtle':
        return colors.text.subtle;
      case 'inverse':
        return colors.text.inverse;
      case 'primary':
        return colors.primary;
      case 'accent':
        return colors.accent;
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'sale':
        return colors.sale;
      case 'body':
      default:
        return colors.text.body;
    }
  }, [tone, colors]);

  return (
    <BaseText
      bold={useBoldFace}
      style={[
        spec,
        { color: toneColor, fontWeight: resolvedWeight },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
});
