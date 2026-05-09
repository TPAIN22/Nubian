import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCheckoutTheme } from './theme';

type Props = {
  size?: number;
};

export const SuccessAnimation = React.memo(function SuccessAnimation({
  size = 96,
}: Props) {
  const t = useCheckoutTheme();
  const ringScale = useSharedValue(0.6);
  const ringOpacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const pulse = useSharedValue(0.7);
  const pulseOpacity = useSharedValue(0);

  useEffect(() => {
    ringOpacity.value = withTiming(1, { duration: 220 });
    ringScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    checkScale.value = withDelay(
      180,
      withSpring(1, { damping: 11, stiffness: 200 }),
    );
    pulseOpacity.value = withDelay(
      120,
      withSequence(
        withTiming(0.5, { duration: 360, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 600 }),
      ),
    );
    pulse.value = withDelay(
      120,
      withTiming(1.45, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
  }, [ringOpacity, ringScale, checkScale, pulse, pulseOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      style={[
        styles.wrap,
        { width: size * 1.6, height: size * 1.6 },
      ]}
      accessibilityElementsHidden
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.center,
          pulseStyle,
        ]}
      >
        <View
          style={[
            styles.pulseRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: t.successSoft,
            },
          ]}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.disc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: t.success,
          },
          ringStyle,
        ]}
      >
        <Animated.View style={checkStyle}>
          <Ionicons
            name="checkmark"
            size={Math.round(size * 0.5)}
            color={t.textInverse}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  pulseRing: { opacity: 0.5 },
  disc: { alignItems: 'center', justifyContent: 'center' },
});
