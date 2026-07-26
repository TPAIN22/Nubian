import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';
import { elevation, radius, spacing, type ElevationLevel } from '@/theme/tokens';
import { useColors } from '@/hooks/useColors';

export interface SurfaceProps extends ViewProps {
  /** Shadow/elevation step. `sm` is the default resting card. */
  level?: ElevationLevel;
  /** Inner padding. `none` when the surface holds an edge-to-edge image. */
  padding?: keyof typeof spacing | number;
  rounded?: keyof typeof radius | number;
  /** Adds a hairline outline. Use instead of a shadow on dense list surfaces. */
  bordered?: boolean;
  /** Slightly recessed fill — for wells inside an already-white card. */
  muted?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * A white card on the grey canvas — the app's fundamental content container.
 *
 * Using this instead of an ad-hoc `<View style={{backgroundColor:'#fff',
 * borderRadius:12, elevation:3}}>` is what keeps every card in the app on the
 * same radius and the same (soft, wide, low-opacity) shadow. Heavy dark shadows
 * were the single biggest contributor to the old "dated" feel.
 */
export const Surface = React.memo(function Surface({
  level = 'sm',
  padding = 'base',
  rounded = 'card',
  bordered = false,
  muted = false,
  style,
  children,
  ...rest
}: SurfaceProps) {
  const colors = useColors();

  const pad = typeof padding === 'number' ? padding : spacing[padding];
  const rad = typeof rounded === 'number' ? rounded : radius[rounded];

  return (
    <View
      style={[
        {
          backgroundColor: muted ? colors.surfaceMuted : colors.cardBackground,
          padding: pad,
          borderRadius: rad,
          borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: colors.borderLight,
        },
        // A shadow can't render through `overflow: hidden`, so callers that clip
        // an image should pass `level="none"` and wrap in their own shadow view.
        elevation[level],
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
});

/**
 * Full-bleed page background. Every screen root should use this so the canvas
 * colour is decided in exactly one place.
 */
export const Screen = React.memo(function Screen({
  style,
  children,
  ...rest
}: ViewProps & { children?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }, style]} {...rest}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
