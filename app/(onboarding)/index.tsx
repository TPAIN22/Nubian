import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  I18nManager,
  Pressable,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useColors } from '@/hooks/useColors';
import i18n from '@/utils/i18n';
import { LanguageContext } from '@/utils/LanguageContext';
import { registerForPushNotificationsAsync } from '@/utils/pushToken';

const { width: SCREEN_W } = Dimensions.get('window');
const ONBOARDING_KEY = 'hasSeenOnboarding';
// How far the image drifts during a swipe, as a fraction of screen width.
// The image is up-scaled by IMAGE_SCALE so it always covers the slide
// even at peak drift (scale must exceed 1 + 2 * PARALLAX_FACTOR).
const PARALLAX_FACTOR = 0;
const IMAGE_SCALE = 1;

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: number | string;
};

type SlideMeta = {
  id: string;
  keyPrefix: string;
  image: number | string;
};

const SLIDE_META: SlideMeta[] = [
  {
    id: 'curated',
    keyPrefix: 'onboarding_slide1',
    image: require('../../assets/images/onboard.webp'),
  },
  {
    id: 'logistics',
    keyPrefix: 'onboarding_slide2',
    image: require('../../assets/images/onboard3.webp'),
  },
  {
    id: 'secure',
    keyPrefix: 'onboarding_slide3',
    image: require('../../assets/images/onboard4.webp'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { language } = useContext(LanguageContext);

  // Re-derive translated slides whenever the language changes.
  const slides = useMemo<Slide[]>(
    () =>
      SLIDE_META.map((meta) => ({
        id: meta.id,
        image: meta.image,
        eyebrow: i18n.t(`${meta.keyPrefix}_eyebrow`),
        title: i18n.t(`${meta.keyPrefix}_title`),
        description: i18n.t(`${meta.keyPrefix}_description`),
      })),
    // language is a dependency only so we re-run when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  );

  const listRef = useRef<Animated.FlatList<Slide>>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const lastIndex = slides.length - 1;
  const isLast = index === lastIndex;

  const markSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      /* non-fatal */
    }
  }, []);

  const goGuest = useCallback(async () => {
    await markSeen();
    await AsyncStorage.setItem('isGuest', 'true');
    router.replace('/(tabs)');
  }, [markSeen, router]);

  const goAuthChoice = useCallback(async () => {
    await markSeen();
    // Ask for push notification permission before leaving onboarding.
    // Fire-and-forget — don't block navigation on the result.
    registerForPushNotificationsAsync(null).catch(() => {});
    router.replace('/(auth)/welcome');
  }, [markSeen, router]);

  const goTo = useCallback((next: number) => {
    listRef.current?.scrollToOffset({
      offset: next * SCREEN_W,
      animated: true,
    });
  }, []);

  const handleNext = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (isLast) {
      goAuthChoice();
      return;
    }
    goTo(index + 1);
  }, [isLast, index, goTo, goAuthChoice]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first?.index != null) {
        setIndex(first.index);
        Haptics.selectionAsync().catch(() => {});
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  // Full-bleed images: text colors are fixed white-on-image.
  // Theme only affects the brand-color CTA + the canvas behind any image gaps.
  const surface = colors.background;
  const dotInactive = 'rgba(255,255,255,0.35)';
  const ctaTextColor = '#FFFFFF';

  const ctaLabel =
    (isLast ? i18n.t('onboarding_start') : i18n.t('onboarding_next')) ||
    (isLast ? 'Get Started' : 'Next');

  const renderItem = useCallback(
    ({ item, index: i }: { item: Slide; index: number }) => (
      <Slide
        slide={item}
        index={i}
        scrollX={scrollX}
        accentColor={colors.primary}
      />
    ),
    [scrollX, colors.primary],
  );

  const keyExtractor = useCallback((item: Slide) => item.id, []);
  const getItemLayout = useCallback(
    (_: ArrayLike<Slide> | null | undefined, i: number) => ({
      length: SCREEN_W,
      offset: SCREEN_W * i,
      index: i,
    }),
    [],
  );

  return (
    <View style={[styles.root, { backgroundColor: surface }]}>
      {/* Carousel — full-bleed, absolutely fills the screen */}
      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        bounces={false}
        decelerationRate="fast"
        style={StyleSheet.absoluteFill}
      />

      {/* Top scrim — keeps header text legible against the image */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)']}
        locations={[0, 1]}
        style={[styles.topScrim, { height: insets.top + 110 }]}
      />

      {/* Header overlay */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
       
        <Pressable
          onPress={goGuest}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('onboarding_skip') || 'Skip'}
          style={({ pressed }) => [
            styles.skipBtn,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Text style={styles.skipTextOverlay}>
            {i18n.t('onboarding_skip') || 'Skip'}
          </Text>
        </Pressable>
      </View>

      {/* Bottom scrim — readability under text + footer */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.5, 1]}
        style={styles.bottomScrim}
      />

      {/* Footer overlay */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        <Dots
          count={slides.length}
          scrollX={scrollX}
          activeColor={colors.primary}
          inactiveColor={dotInactive}
        />

        <Pressable
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.ctaWrap,
            {
              shadowColor: colors.primary,
              transform: [{ scale: pressed ? 0.985 : 1 }],
              opacity: pressed ? 0.96 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.cta}
          >
            <View style={styles.ctaInnerBorder} pointerEvents="none" />
            <Text style={[styles.ctaText, { color: ctaTextColor }]}>
              {ctaLabel}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

/* ---------------- Slide ---------------- */

type SlideProps = {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
  accentColor: string;
};

function Slide({ slide, index, scrollX, accentColor }: SlideProps) {
  const inputRange = [
    (index - 1) * SCREEN_W,
    index * SCREEN_W,
    (index + 1) * SCREEN_W,
  ];

  const imageStyle = useAnimatedStyle(() => {
    // Image lags behind the swipe (classic parallax): as the container moves
    // left, the image shifts right within it so it visually "catches up" slowly.
    // The base IMAGE_SCALE keeps the image wider than the slide at every offset
    // so it always covers full screen — no empty bands at the edges.
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-SCREEN_W * PARALLAX_FACTOR, 0, SCREEN_W * PARALLAX_FACTOR],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale: IMAGE_SCALE }, { translateX }] };
  });

  const textStyle = useAnimatedStyle(() => {
    // Text moves WITH the swipe at a faster rate so it leaves first
    // and arrives last — opposite sign to the image for nice depth.
    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-SCREEN_W * 0.25, 0, SCREEN_W * 0.25],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateX }], opacity };
  });

  return (
    <View style={styles.slide}>
      {/* Full-bleed image with parallax */}
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <Image
          source={slide.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          priority="high"
          cachePolicy="memory-disk"
          transition={300}
        />
      </Animated.View>

      {/* Text overlay near the bottom, just above the footer */}
      <Animated.View style={[styles.textBlock, textStyle]}>
        <View style={styles.eyebrowRow}>
          <View style={[styles.eyebrowDot, { backgroundColor: accentColor }]} />
          <Text
            style={[styles.eyebrow, { color: accentColor }]}
            numberOfLines={1}
          >
            {slide.eyebrow.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {slide.title}
        </Text>

        <Text style={styles.description} numberOfLines={3}>
          {slide.description}
        </Text>
      </Animated.View>
    </View>
  );
}

/* ---------------- Dots ---------------- */

type DotsProps = {
  count: number;
  scrollX: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
};

function Dots({ count, scrollX, activeColor, inactiveColor }: DotsProps) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot
          key={i}
          index={i}
          count={count}
          scrollX={scrollX}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

function Dot({
  index,
  count,
  scrollX,
  activeColor,
  inactiveColor,
}: {
  index: number;
  count: number;
  scrollX: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}) {
  const inputRange = useMemo(() => {
    // In RTL, the dots row auto-flips (dot 0 is rendered on the right).
    // We want the visually-rightmost dot to be active when slide 0 is showing
    // (scrollX = 0). Since the dot at JS index 0 is the one rendered on the
    // right after auto-flip, its active scroll position should be 0 — same
    // as LTR. The mismatch users see comes from the *visual* order of dots
    // not matching the *scroll direction* perceived in their locale.
    // Fix: map the dot's effective index to match the slide order in the
    // current writing direction.
    const effective = I18nManager.isRTL ? count - 1 - index : index;
    return [
      (effective - 1) * SCREEN_W,
      effective * SCREEN_W,
      (effective + 1) * SCREEN_W,
    ];
  }, [index, count]);

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 22, 6],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP,
    );
    return { width, opacity };
  });

  const colorStyle = useAnimatedStyle(() => {
    const t = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return {
      backgroundColor: t > 0.5 ? activeColor : inactiveColor,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle, colorStyle]} />;
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  root: { flex: 1 },

  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: 1,
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 5,
  },
  brandOverlay: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  skipBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  skipTextOverlay: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.85)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  slide: {
    width: SCREEN_W,
    flex: 1,
    overflow: 'hidden',
  },
  textBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 260,
    paddingHorizontal: 28,
    gap: 12,
    zIndex: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    lineHeight: 50,
    letterSpacing: -0.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    maxWidth: 380,
    color: 'rgba(255,255,255,0.88)',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 28,
    alignItems: 'center',
    zIndex: 5,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 8,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },

  ctaWrap: {
    width: '100%',
    borderRadius: 16,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 10,
  },
  cta: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaInnerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  ctaText: {
    width: '100%',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
});
