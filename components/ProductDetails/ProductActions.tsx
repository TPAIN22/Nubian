import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { memo, useCallback } from 'react';
import AddToCartButton from '../AddToCartButton';
import type { SelectedAttributes } from '@/domain/product/product.selectors';
import type { NormalizedProduct } from '@/domain/product/product.normalize';
import type { LightColors, DarkColors } from '@/theme';

interface ProductActionsProps {
  product: NormalizedProduct;
  selectedAttributes: SelectedAttributes;
  isAvailable: boolean;
  themeColors: LightColors | DarkColors;
  onAttempt?: () => void;
}

export const ProductActions = memo(
  ({ product, selectedAttributes, isAvailable, themeColors, onAttempt }: ProductActionsProps) => {
    const insets = useSafeAreaInsets();

    const handleAttempt = useCallback(() => {
      if (!isAvailable) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
      onAttempt?.();
    }, [isAvailable, onAttempt]);

    const content = (
      <View style={[styles.inner, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <AddToCartButton
          product={product}
          selectedAttributes={selectedAttributes}
          buttonStyle={[styles.cartButton, !isAvailable && styles.cartButtonDisabled]}
          disabled={!isAvailable}
          onPressAttempt={handleAttempt}
        />
      </View>
    );

    if (Platform.OS === 'ios') {
      return (
        <BlurView intensity={85} tint="systemChromeMaterial" style={styles.container}>
          {content}
        </BlurView>
      );
    }

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.surface,
            borderTopColor: themeColors.borderLight,
          },
        ]}
      >
        {content}
      </View>
    );
  }
);
ProductActions.displayName = 'ProductActions';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cartButton: {
    borderRadius: 30,
    paddingVertical: 17,
  },
  cartButtonDisabled: {
    opacity: 0.65,
  },
});
