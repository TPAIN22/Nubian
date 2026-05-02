import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/useColors';
import i18n from '../../utils/i18n';

const { width: SCREEN_W } = Dimensions.get('window');
const ONBOARDING_KEY = 'hasSeenOnboarding';

type IconName = keyof typeof Feather.glyphMap;

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: IconName;
  image?: any;
};

const SLIDES: Slide[] = [
  {
    id: 'curated',
    eyebrow: 'For you',
    title: 'Curated for You',
    description:
      'A personalised feed shaped by what you love — quiet picks, not noise.',
    icon: 'star',
    image: require('../../assets/images/onboard1.svg'),
  },
  {
    id: 'logistics',
    eyebrow: 'Worldwide',
    title: 'Global Logistics',
    description:
      'Fast, traceable shipping from trusted partners — to your doorstep, anywhere.',
    icon: 'truck',
    image: require('../../assets/images/onboard3.webp'),
  },
  {
    id: 'secure',
    eyebrow: 'Protected',
    title: 'Secure Checkout',
    description:
      'Bank-grade encryption and buyer protection on every order, every time.',
    icon: 'shield',
    image: require('../../assets/images/onboard4.webp'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const lastIndex = SLIDES.length - 1;
  const isLast = index === lastIndex;

  const markSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // non-fatal
    }
  }, []);

  const goGuest = useCallback(async () => {
    await markSeen();
    await AsyncStorage.setItem('isGuest', 'true');
    router.replace('/(tabs)');
  }, [markSeen, router]);

  const goSignIn = useCallback(async () => {
    await markSeen();
    router.replace('/(auth)/signin');
  }, [markSeen, router]);

  const goAuthChoice = useCallback(async () => {
    await markSeen();
    router.replace('/(auth)/welcome');
  }, [markSeen, router]);

  const goTo = useCallback((next: number) => {
    listRef.current?.scrollToOffset({
      offset: next * SCREEN_W,
      animated: true,
    });
    setIndex(next);
  }, []);

  const handleNext = useCallback(() => {
    if (__DEV__) console.log('[onboarding] CTA pressed, index=', index, 'isLast=', isLast);
    if (isLast) {
      goAuthChoice();
      return;
    }
    goTo(index + 1);
  }, [isLast, index, goTo, goAuthChoice]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (i !== index) setIndex(i);
    },
    [index]
  );

  const ctaLabel = isLast ? i18n.t('getStarted') : i18n.t('next');
  const ctaLabelFallback = isLast ? 'Get Started' : 'Next';

  return (
    <View style={[styles.root, { backgroundColor: '#000' }]}>
      {/* Carousel area — flex fills space ABOVE the footer, never overlaps it */}
      <View style={styles.carouselArea}>
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          keyboardShouldPersistTaps="handled"
          style={StyleSheet.absoluteFill}
          renderItem={({ item, index: i }) => (
            <ValuePropSlide slide={item} active={i === index} />
          )}
          getItemLayout={(_, i) => ({
            length: SCREEN_W,
            offset: SCREEN_W * i,
            index: i,
          })}
          onScrollToIndexFailed={(info) => {
            listRef.current?.scrollToOffset({
              offset: info.index * SCREEN_W,
              animated: true,
            });
          }}
        />

        {/* Top overlay sits inside the carousel area only */}
        <View
          pointerEvents="box-none"
          style={[styles.topOverlay, { paddingTop: insets.top }]}
        >
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 450 }}
            style={[
              styles.rewardBanner,
              {
                backgroundColor: 'rgba(0,0,0,0.45)',
                borderColor: 'rgba(255,255,255,0.2)',
              },
            ]}
          >
            <Feather name="gift" size={14} color="#FFFFFF" />
            <Text
              style={[styles.rewardText, { color: '#FFFFFF' }]}
              numberOfLines={1}
            >
              Finish onboarding to unlock{' '}
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>10% off</Text>{' '}
              your first order
            </Text>
          </MotiView>

          <View style={styles.header}>
            <Text style={[styles.brand, { color: '#FFFFFF', letterSpacing: 4 }]}>
              NUBIAN
            </Text>
            <TouchableOpacity onPress={goGuest} hitSlop={12} activeOpacity={0.6}>
              <Text style={[styles.skip, { color: 'rgba(255,255,255,0.85)' }]}>
                {i18n.t('onboarding_skip')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Footer is a real flex sibling — NOT layered on top of the FlatList,
          so the FlatList's pan responder cannot swallow the press. */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) + 8 },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.92)', '#000']}
          locations={[0, 0.4, 1]}
          style={styles.footerGradient}
        />
        <Dots count={SLIDES.length} active={index} />

        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel || ctaLabelFallback}
          style={[styles.cta, { backgroundColor: colors.primary }]}
        >
          <View style={styles.ctaInner} pointerEvents="none">
            <Text style={styles.ctaText}>{ctaLabel || ctaLabelFallback}</Text>
            <View style={styles.ctaArrow}>
              <Feather
                name={isLast ? 'log-in' : 'arrow-right'}
                size={16}
                color={colors.primary}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goSignIn}
          hitSlop={10}
          activeOpacity={0.7}
          style={styles.secondaryRow}
        >
          <Text style={styles.secondaryHint}>Already have an account?</Text>
          <Text style={[styles.secondaryLink, { color: '#FFFFFF' }]}>
            Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- Value-prop slide ---------------- */

function ValuePropSlide({ slide, active }: { slide: Slide; active: boolean }) {
  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      {slide.image && (
        <Image
          source={slide.image}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          priority="high"
          cachePolicy="memory-disk"
        />
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
        locations={[0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      <MotiView
        key={active ? `${slide.id}-on` : `${slide.id}-off`}
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: active ? 1 : 0.6, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.slideOverlay}
        pointerEvents="none"
      >
        <View style={styles.iconBadge}>
          <Feather name={slide.icon} size={20} color="#FFFFFF" />
        </View>

        <Text style={styles.eyebrowOverlay}>{slide.eyebrow.toUpperCase()}</Text>
        <Text style={styles.titleOverlay}>{slide.title}</Text>
        <Text style={styles.descriptionOverlay}>{slide.description}</Text>
      </MotiView>
    </View>
  );
}

/* ---------------- Dots ---------------- */

function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <MotiView
            key={i}
            animate={{
              width: isActive ? 24 : 6,
              backgroundColor: isActive
                ? '#FFFFFF'
                : 'rgba(255,255,255,0.45)',
            }}
            transition={{ type: 'timing', duration: 280 }}
            style={styles.dot}
          />
        );
      })}
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  root: { flex: 1 },

  carouselArea: {
    flex: 1,
    overflow: 'hidden',
  },

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
  },

  rewardBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rewardText: { fontSize: 12, fontWeight: '400' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  brand: { fontSize: 12, fontWeight: '600' },
  skip: { fontSize: 14, fontWeight: '500' },

  /* Slides */
  slide: { flex: 1, overflow: 'hidden' },
  slideOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 32,
    paddingBottom: 28,
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    marginBottom: 8,
  },
  eyebrowOverlay: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.85)',
  },
  titleOverlay: {
    fontSize: 34,
    fontWeight: '400',
    color: '#FFFFFF',
    lineHeight: 42,
  },
  descriptionOverlay: {
    fontSize: 15,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    maxWidth: 360,
  },

  /* Footer — real flex sibling at bottom, NOT absolute */
  footer: {
    paddingHorizontal: 28,
    paddingTop: 24,
    gap: 18,
    alignItems: 'center',
    backgroundColor: '#000',
  },
  footerGradient: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    height: 60,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 12,
  },
  dot: { height: 6, borderRadius: 999 },

  cta: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingLeft: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  secondaryHint: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.7)',
  },
  secondaryLink: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
