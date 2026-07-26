import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from 'react';
import type { ViewabilityConfig, ViewToken } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { PRODUCT_DETAILS_CONFIG } from '@/constants/productDetails';
import { AppText, Touchable } from '@/components/ui/kit';
import { iconSize, radius, spacing } from '@/theme/tokens';
import i18n from '@/utils/i18n';
import type { LightColors, DarkColors } from '@/theme';

const { SCREEN_WIDTH } = PRODUCT_DETAILS_CONFIG;

/**
 * Gallery ratio.
 *
 * A 1:1 hero was square with the screen, which cropped tall products (clothing,
 * bottles) hard and left short ones swimming. 1.12 gives a portrait frame close
 * to what Amazon/Noon use, so the product is bigger without cropping more.
 */
const IMAGE_HEIGHT = Math.round(SCREEN_WIDTH * 1.12);

interface Props {
  images: string[];
  colors: LightColors | DarkColors;
  onImagePress?: (uri: string) => void;
}

const PaginationDot = memo(
  ({ active, activeColor, inactiveColor }: { active: boolean; activeColor: string; inactiveColor: string }) => {
    const width = useSharedValue(active ? 20 : 6);

    useEffect(() => {
      width.value = withSpring(active ? 20 : 6, { damping: 18, stiffness: 220 });
    }, [active]);

    const animStyle = useAnimatedStyle(() => ({ width: width.value }));

    return (
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: active ? activeColor : inactiveColor },
          animStyle,
        ]}
      />
    );
  }
);
PaginationDot.displayName = 'PaginationDot';

/**
 * Product photo gallery.
 *
 * Additions over the previous version, all aimed at making the gallery feel
 * navigable rather than accidental:
 *  - an "n / total" counter pill, which stays readable when there are more
 *    photos than dots can usefully represent;
 *  - an explicit expand affordance, because tap-to-zoom was previously
 *    undiscoverable;
 *  - the photo well uses the neutral placeholder colour, so a slow decode shows
 *    calm grey instead of a white flash.
 */
export const ProductImageCarousel = memo(({ images, colors, onImagePress }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [firstLoaded, setFirstLoaded] = useState(false);
  const flatListRef = useRef<FlatList<string>>(null);
  const prevFirstRef = useRef<string | null>(null);

  const validImages = useMemo(
    () => images.filter(img => typeof img === 'string' && img.trim().length > 0),
    [images]
  );

  useEffect(() => {
    const first = validImages[0] ?? null;
    if (first !== prevFirstRef.current) {
      prevFirstRef.current = first;
      setFirstLoaded(false);
      setCurrentIndex(0);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [validImages]);

  const viewabilityConfig: ViewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    []
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index ?? 0;
      setCurrentIndex(idx);
    },
    []
  );

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <Touchable
        onPress={() => onImagePress?.(item)}
        // Barely-there: the gallery is the page's centrepiece, and a visible
        // shrink on every swipe-start would be distracting.
        scaleTo={0.99}
        accessibilityRole="imagebutton"
        accessibilityHint="Opens the photo full screen"
        accessibilityLabel={
          (i18n.t('image') || 'Image') +
          ` ${index + 1} ${i18n.t('of') || 'of'} ${validImages.length}`
        }
        style={[styles.imageWrapper, { backgroundColor: colors.imagePlaceholder }]}
      >
        <Image
          source={{ uri: item }}
          contentFit="cover"
          style={styles.image}
          cachePolicy="memory-disk"
          priority={index === 0 ? 'high' : 'normal'}
          transition={220}
          onLoad={() => { if (index === 0) setFirstLoaded(true); }}
        />
        {index === 0 && !firstLoaded && (
          <View
            style={[styles.loaderOverlay, { backgroundColor: colors.imagePlaceholder }]}
            pointerEvents="none"
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </Touchable>
    ),
    [onImagePress, firstLoaded, colors, validImages.length]
  );

  if (validImages.length === 0) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.imagePlaceholder }]}>
        <Ionicons name="image-outline" size={iconSize.hero} color={colors.text.subtle} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.imagePlaceholder }]}>
      <FlatList
        ref={flatListRef}
        data={validImages}
        renderItem={renderItem}
        keyExtractor={(item, i) => `${item}-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
        removeClippedSubviews
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
      />

      {/* Tap-to-zoom hint. Positioned bottom-start so it can never collide with
          the floating wishlist/back controls at the top. */}
      <View style={styles.expandHint} pointerEvents="none">
        <Ionicons name="expand-outline" size={iconSize.sm} color="#FFFFFF" />
      </View>

      {validImages.length > 1 && (
        <>
          <View style={styles.counter} pointerEvents="none">
            <AppText variant="micro" weight="700" style={styles.counterText}>
              {currentIndex + 1} / {validImages.length}
            </AppText>
          </View>

          <View style={styles.pagination} pointerEvents="none">
            {/* Dots cap out at 6 — beyond that the counter carries the position
                and a row of 15 dots is just noise. */}
            {validImages.slice(0, 6).map((_, i) => (
              <PaginationDot
                key={i}
                active={i === Math.min(currentIndex, 5)}
                activeColor={colors.primary}
                inactiveColor={colors.borderMedium}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
});
ProductImageCarousel.displayName = 'ProductImageCarousel';

const OVERLAY_BG = 'rgba(11,18,32,0.55)';

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    position: 'absolute',
    bottom: spacing.lg,
    end: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: OVERLAY_BG,
  },
  counterText: { color: '#FFFFFF' },
  expandHint: {
    position: 'absolute',
    bottom: spacing.lg,
    start: spacing.base,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OVERLAY_BG,
  },
  pagination: {
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs + 1,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
