import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { PRODUCT_DETAILS_CONFIG } from '@/constants/productDetails';
import type { LightColors, DarkColors } from '@/theme';

const { SCREEN_WIDTH } = PRODUCT_DETAILS_CONFIG;
const IMAGE_HEIGHT = SCREEN_WIDTH;

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
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => onImagePress?.(item)}
        style={[styles.imageWrapper, { backgroundColor: colors.surface }]}
      >
        <Image
          source={{ uri: item }}
          contentFit="cover"
          style={styles.image}
          cachePolicy="memory-disk"
          priority={index === 0 ? 'high' : 'normal'}
          onLoad={() => { if (index === 0) setFirstLoaded(true); }}
        />
        {index === 0 && !firstLoaded && (
          <View
            style={[styles.loaderOverlay, { backgroundColor: colors.surface + 'AA' }]}
            pointerEvents="none"
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    ),
    [onImagePress, firstLoaded, colors]
  );

  if (validImages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.borderMedium }]} />
      </View>
    );
  }

  const dotActiveColor = colors.text.gray;
  const dotInactiveColor = colors.text.gray + '38';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
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
      {validImages.length > 1 && (
        <View style={styles.pagination}>
          {validImages.map((_, i) => (
            <PaginationDot
              key={i}
              active={i === currentIndex}
              activeColor={dotActiveColor}
              inactiveColor={dotInactiveColor}
            />
          ))}
        </View>
      )}
    </View>
  );
});
ProductImageCarousel.displayName = 'ProductImageCarousel';

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
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
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -36,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
