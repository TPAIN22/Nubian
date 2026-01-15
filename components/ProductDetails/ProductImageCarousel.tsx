import { View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useState, useRef, useCallback, useMemo } from 'react';
import type { ViewabilityConfig, ViewToken } from 'react-native';
import { Text } from '@/components/ui/text';
import { PRODUCT_DETAILS_CONFIG, COLORS } from '@/constants/productDetails';
import type { LightColors, DarkColors } from '@/theme';

const { SCREEN_WIDTH, IMAGE_HEIGHT } = PRODUCT_DETAILS_CONFIG;

interface ProductImageCarouselProps {
  images: string[];
  colors: LightColors | DarkColors;
  onImagePress?: (uri: string) => void;
}

export const ProductImageCarousel = ({ images, colors, onImagePress }: ProductImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [firstImageLoaded, setFirstImageLoaded] = useState(false);
  const flatListRef = useRef<FlatList<string>>(null);

  // Reset index and scroll to top when images change (e.g. variant selection)
  useMemo(() => {
    setCurrentImageIndex(0);
    setFirstImageLoaded(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [images]);

  // Ensure we have a valid images array
  const validImages = useMemo(() => {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return [];
    }
    return images.filter(img => img && typeof img === 'string' && img.trim().length > 0);
  }, [images]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems?.[0];
    const idx = typeof first?.index === "number" ? first.index : 0;
    setCurrentImageIndex(idx);
  }, []);

  const viewabilityConfig: ViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: PRODUCT_DETAILS_CONFIG.PAGINATION_THRESHOLD
  }), []);

  const renderImageItem = useCallback(({ item: uri, index }: { item: string; index: number }) => {
    const showOverlay = index === 0 && !firstImageLoaded;
    
    if (!uri || typeof uri !== 'string') {
      return (
        <View style={styles.imageWrapper}>
          <Text style={{ color: colors.text.veryLightGray }}>Invalid image</Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity
        style={styles.imageWrapper}
        onPress={() => onImagePress?.(uri)}
        activeOpacity={0.8}
        accessibilityLabel={`Product image ${index + 1} of ${validImages.length}`}
        accessibilityRole="imagebutton"
      >
        <Image
          source={{ uri }}
          alt="Product image"
          contentFit="contain"
          style={styles.productImage}
          cachePolicy="memory-disk"
          priority={index === 0 ? "high" : "normal"}
          onLoad={() => {
            if (index === 0) setFirstImageLoaded(true);
          }}
          onError={(error) => {
            if (__DEV__) {
              console.warn('Image failed to load:', uri, error);
            }
          }}
        />
        {showOverlay && (
          <View style={styles.imageLoaderOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={COLORS.LOADING_INDICATOR} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [onImagePress, firstImageLoaded, validImages.length, colors.text.veryLightGray]);

  const renderPagination = useCallback(() => {
    if (!validImages || validImages.length <= 1) return null;
    
    return (
      <View style={styles.pagination}>
        {validImages.map((_, index: number) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: colors.text.white },
              index === currentImageIndex && styles.activeDot
            ]}
          />
        ))}
      </View>
    );
  }, [validImages, currentImageIndex, colors.text.white]);

  // Show placeholder if no images
  if (!validImages || validImages.length === 0) {
    return (
      <View style={styles.imageSection}>
        <View style={[styles.imageContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.text.veryLightGray }}>No images available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.imageSection}>
      <View style={styles.imageContainer}>
        <FlatList
          data={validImages}
          keyExtractor={(item, index) => {
            const url = item || `image-${index}`;
            return `${url}-${index}`;
          }}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderImageItem}
          ref={flatListRef}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          pagingEnabled
          initialNumToRender={PRODUCT_DETAILS_CONFIG.INITIAL_NUM_TO_RENDER}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          removeClippedSubviews={true}
          maxToRenderPerBatch={PRODUCT_DETAILS_CONFIG.MAX_RENDER_PER_BATCH}
          windowSize={PRODUCT_DETAILS_CONFIG.FLATLIST_WINDOW_SIZE}
        />
        {renderPagination()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageSection: {
    position: 'relative',
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  imageLoaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.IMAGE_LOADER_OVERLAY,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
  },
});
