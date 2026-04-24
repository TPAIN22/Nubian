import { useEffect } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from "react-native-reanimated";

export const ProductDetailsSkeleton = ({ colors }: { colors: any }) => {
  const skeletonColor = colors.borderLight + '40';
  const shimmerValue = useSharedValue(0.3);

  useEffect(() => {
    shimmerValue.value = withRepeat(withTiming(0.7, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: shimmerValue.value }));

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={{ height: 60, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: skeletonColor }} />
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: skeletonColor }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ width: '100%', aspectRatio: 1, backgroundColor: skeletonColor }}>
          <Animated.View style={[animatedStyle, { flex: 1, backgroundColor: colors.borderLight + '60' }]} />
          <View style={{ position: 'absolute', bottom: 15, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            {[1, 2, 3].map(i => (
              <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', opacity: 0.5 }} />
            ))}
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <Animated.View style={[animatedStyle, { width: 100, height: 14, borderRadius: 4, backgroundColor: colors.primary + '30', marginBottom: 8 }]} />
          <Animated.View style={[animatedStyle, { width: '85%', height: 28, borderRadius: 6, backgroundColor: skeletonColor, marginBottom: 15 }]} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 25, gap: 10 }}>
            <Animated.View style={[animatedStyle, { width: 120, height: 35, borderRadius: 8, backgroundColor: colors.primary + '20' }]} />
            <Animated.View style={[animatedStyle, { width: 60, height: 20, borderRadius: 4, backgroundColor: skeletonColor }]} />
          </View>

          <View style={{ height: 1, backgroundColor: colors.borderLight + '50', marginBottom: 25 }} />

          <Animated.View style={[animatedStyle, { width: 80, height: 18, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 15 }]} />
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 30 }}>
            {[1, 2, 3, 4].map(i => (
              <Animated.View key={i} style={[animatedStyle, { width: 60, height: 45, borderRadius: 12, backgroundColor: skeletonColor }]} />
            ))}
          </View>

          <Animated.View style={[animatedStyle, { width: 80, height: 18, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 15 }]} />
          <View style={{ flexDirection: 'row', gap: 15, marginBottom: 30 }}>
            {[1, 2, 3].map(i => (
              <Animated.View key={i} style={[animatedStyle, { width: 40, height: 40, borderRadius: 20, backgroundColor: skeletonColor, borderWidth: 1, borderColor: colors.borderLight }]} />
            ))}
          </View>

          <View style={{ marginBottom: 30 }}>
            <Animated.View style={[animatedStyle, { width: 140, height: 16, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 8 }]} />
            <Animated.View style={[animatedStyle, { width: 100, height: 14, borderRadius: 4, backgroundColor: skeletonColor }]} />
          </View>

          <Animated.View style={[animatedStyle, { width: 120, height: 20, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 15 }]} />
          {[1, 2, 3, 4].map(i => (
            <Animated.View key={i} style={[animatedStyle, { width: i === 4 ? '60%' : '100%', height: 14, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 8 }]} />
          ))}

          <View style={{ marginTop: 40, paddingVertical: 20, borderTopWidth: 1, borderTopColor: colors.borderLight + '50' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Animated.View style={[animatedStyle, { width: 100, height: 22, borderRadius: 4, backgroundColor: skeletonColor }]} />
              <Animated.View style={[animatedStyle, { width: 60, height: 18, borderRadius: 4, backgroundColor: skeletonColor }]} />
            </View>
            <View style={{ backgroundColor: skeletonColor, height: 100, borderRadius: 15, width: '100%' }} />
          </View>

          <View style={{ marginTop: 20 }}>
            <Animated.View style={[animatedStyle, { width: 180, height: 22, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 20 }]} />
            <View style={{ flexDirection: 'row', gap: 15 }}>
              {[1, 2].map(i => (
                <View key={i} style={{ flex: 1 }}>
                  <Animated.View style={[animatedStyle, { aspectRatio: 0.8, borderRadius: 15, backgroundColor: skeletonColor, marginBottom: 10 }]} />
                  <Animated.View style={[animatedStyle, { width: '80%', height: 14, borderRadius: 4, backgroundColor: skeletonColor, marginBottom: 6 }]} />
                  <Animated.View style={[animatedStyle, { width: '50%', height: 14, borderRadius: 4, backgroundColor: colors.primary + '20' }]} />
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, width: '100%',
        padding: 16, paddingBottom: 32, backgroundColor: colors.surface,
        borderTopWidth: 1, borderTopColor: colors.borderLight,
        flexDirection: 'row', gap: 12,
      }}>
        <View style={{ width: 55, height: 55, borderRadius: 15, backgroundColor: skeletonColor }} />
        <View style={{ flex: 1, height: 55, borderRadius: 15, backgroundColor: colors.primary + '40' }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});
