/**
 * `CartAnimationLayer` — the app-wide feedback surface for add-to-cart.
 *
 * Mounted once, at the root, above the navigator. It listens on the
 * `cartFeedback` bus and owns two things:
 *
 *  1. **Fly-to-cart.** The product image arcs from the button that was pressed
 *     to the tab bar's cart icon, shrinking as it goes, and pings the badge on
 *     arrival. Both endpoints are real measured rects, so it works from the
 *     details CTA, a product card, or a bottom sheet without any of them
 *     knowing where the cart icon is.
 *  2. **Confirmation card.** The bottom-anchored "Added to cart · View cart".
 *
 * The whole layer is `pointerEvents="box-none"` and the flights are
 * `pointerEvents="none"`, so nothing here can ever swallow a tap meant for the
 * screen underneath. If the cart icon has not been laid out (no tab bar on the
 * current screen) `flyToCart` no-ops and only the card is shown.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useCheckoutTheme } from '@/components/checkout/theme';

import {
  bumpCartBadge,
  subscribeConfirmations,
  subscribeFlights,
  type CartConfirmation,
  type CartFlight,
} from './cartFeedback';
import { CartSuccessOverlay } from './CartSuccessOverlay';

/** Largest the flying thumbnail is allowed to start at. */
const MAX_FLIGHT_SIZE = 76;
const FLIGHT_MS = 620;

export const CartAnimationLayer = React.memo(function CartAnimationLayer() {
  const [flights, setFlights] = useState<CartFlight[]>([]);
  const [confirmation, setConfirmation] = useState<CartConfirmation | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    return subscribeFlights(flight => {
      // Reduced motion: skip the travel, still pulse the badge.
      if (reduceMotion) {
        bumpCartBadge();
        return;
      }
      // Cap concurrent flights — ten rapid taps should not mount ten images.
      setFlights(prev => [...prev.slice(-3), flight]);
    });
  }, [reduceMotion]);

  useEffect(() => {
    return subscribeConfirmations(next => setConfirmation(next));
  }, []);

  const removeFlight = useCallback((id: string) => {
    setFlights(prev => prev.filter(f => f.id !== id));
  }, []);

  const dismissConfirmation = useCallback(() => setConfirmation(null), []);

  if (flights.length === 0 && !confirmation) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {flights.map(flight => (
        <FlyingProduct key={flight.id} flight={flight} onDone={removeFlight} />
      ))}

      {confirmation ? (
        <CartSuccessOverlay
          key={confirmation.id}
          confirmation={confirmation}
          onDismiss={dismissConfirmation}
        />
      ) : null}
    </View>
  );
});

const FlyingProduct = React.memo(function FlyingProduct({
  flight,
  onDone,
}: {
  flight: CartFlight;
  onDone: (id: string) => void;
}) {
  const t = useCheckoutTheme();
  const progress = useSharedValue(0);

  const size = Math.min(
    MAX_FLIGHT_SIZE,
    Math.max(36, Math.min(flight.from.width, flight.from.height) || 56),
  );

  // Start centred on the source, land centred on the cart icon.
  const startX = flight.from.x + flight.from.width / 2 - size / 2;
  const startY = flight.from.y + flight.from.height / 2 - size / 2;
  const endX = flight.to.x + flight.to.width / 2 - size / 2;
  const endY = flight.to.y + flight.to.height / 2 - size / 2;

  const dx = endX - startX;
  const dy = endY - startY;
  // Control point for the arc: lift the path so it curves up and over rather
  // than sliding flatly across the screen.
  const arcLift = Math.min(180, Math.max(60, Math.abs(dy) * 0.45));

  const handleDone = useCallback(() => {
    bumpCartBadge();
    onDone(flight.id);
  }, [flight.id, onDone]);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: FLIGHT_MS, easing: Easing.bezier(0.3, 0, 0.2, 1) },
      finished => {
        if (finished) runOnJS(handleDone)();
      },
    );
  }, [progress, handleDone]);

  const style = useAnimatedStyle(() => {
    const p = progress.value;
    const inv = 1 - p;
    // Quadratic bezier: P0 (0,0) → control (dx/2, -arcLift) → P1 (dx, dy)
    const x = 2 * inv * p * (dx / 2) + p * p * dx;
    const y = 2 * inv * p * -arcLift + p * p * dy;
    return {
      opacity: p < 0.86 ? 1 : 1 - (p - 0.86) / 0.14,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: 1 - 0.72 * p },
        { rotate: `${p * 18}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.flight,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: flight.uri ? t.surfaceMuted : t.accent,
          borderColor: t.border,
        },
        style,
      ]}
    >
      {flight.uri ? (
        <Image
          source={{ uri: flight.uri }}
          style={{ width: size, height: size, borderRadius: size / 4 }}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
        />
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  flight: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
});
