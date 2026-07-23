/**
 * NotificationGesture — swipe-to-dismiss + press-to-pause.
 *
 * Single responsibility: turn finger movement into transforms. It owns no
 * notification state; it reports "the user threw this away" / "the user is
 * holding this" upwards.
 *
 * Only a Pan gesture lives here on purpose. Tap-to-open is a plain `Pressable`
 * inside the card, so the close button and CTA keep working normally — a Tap
 * gesture on this wrapper would swallow their presses. Pan has an activation
 * offset, so a real tap never reaches it.
 */

import { memo, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

/** How far / fast a throw has to be before it counts as a dismiss. */
const SWIPE_X_DISTANCE = 88;
const SWIPE_Y_DISTANCE = 56;
const SWIPE_VELOCITY = 720;
const FLING_MS = 180;

const RETURN_SPRING = { damping: 20, stiffness: 220, mass: 0.7 } as const;

interface Props {
  children: ReactNode;
  /** False for non-dismissible notifications — the card then ignores swipes. */
  enabled: boolean;
  /** The card is off-screen and can be unmounted immediately. */
  onSwipedOut: () => void;
  /** Finger down — freeze the auto-dismiss clock. */
  onPressIn: () => void;
  /** Finger up/cancelled — resume the clock. */
  onPressOut: () => void;
  /** Disables spring physics when the OS asks for reduced motion. */
  reduceMotion: boolean;
}

function NotificationGestureBase({
  children,
  enabled,
  onSwipedOut,
  onPressIn,
  onPressOut,
  reduceMotion,
}: Props) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .enabled(enabled)
    // Let vertical scrolls of the underlying screen win until the user clearly
    // means to move the card.
    .activeOffsetX([-14, 14])
    .activeOffsetY([-14, 14])
    .onBegin(() => {
      runOnJS(onPressIn)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      // Downward drag is heavily damped: notifications leave upward or sideways,
      // so pulling down feels like resistance rather than a broken gesture.
      translateY.value =
        event.translationY < 0 ? event.translationY : event.translationY * 0.25;
    })
    .onEnd((event) => {
      const throwX =
        Math.abs(event.translationX) > SWIPE_X_DISTANCE ||
        Math.abs(event.velocityX) > SWIPE_VELOCITY;
      const throwUp =
        event.translationY < -SWIPE_Y_DISTANCE || event.velocityY < -SWIPE_VELOCITY;

      if (throwX) {
        const direction = (event.translationX || event.velocityX) < 0 ? -1 : 1;
        translateX.value = withTiming(
          direction * (width + 80),
          { duration: FLING_MS },
          (finished) => {
            if (finished) runOnJS(onSwipedOut)();
          }
        );
        return;
      }

      if (throwUp) {
        translateY.value = withTiming(-240, { duration: FLING_MS }, (finished) => {
          if (finished) runOnJS(onSwipedOut)();
        });
        return;
      }

      if (reduceMotion) {
        translateX.value = withTiming(0, { duration: 120 });
        translateY.value = withTiming(0, { duration: 120 });
      } else {
        translateX.value = withSpring(0, RETURN_SPRING);
        translateY.value = withSpring(0, RETURN_SPRING);
      }
    })
    .onFinalize(() => {
      runOnJS(onPressOut)();
    });

  const animatedStyle = useAnimatedStyle(() => {
    const travel = Math.abs(translateX.value) + Math.abs(Math.min(translateY.value, 0));
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        // A whisper of rotation makes the throw feel physical rather than a
        // sliding rectangle.
        {
          rotateZ: `${interpolate(translateX.value, [-width, 0, width], [-4, 0, 4])}deg`,
        },
      ],
      opacity: interpolate(travel, [0, width * 0.6], [1, 0.35], 'clamp'),
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export const NotificationGesture = memo(NotificationGestureBase);
