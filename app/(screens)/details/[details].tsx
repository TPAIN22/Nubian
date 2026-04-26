import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useLayoutEffect,
  memo,
} from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  I18nManager,
  InteractionManager,
  Image as RNImage,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useProductFetch } from '@/hooks/useProductFetch';
import { useIsInWishlist, useWishlistActions } from '@/store/wishlistStore';
import i18n from '@/utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';
import { markScreenMount } from '@/utils/performance';
import { logPerf } from '@/hooks/useProductFetch';

import type { SelectedAttributes } from '@/domain/product/product.selectors';
import {
  getAttributeOptions,
  normalizeSelectedAttributes,
} from '@/domain/product/product.selectors';
import type { NormalizedProduct } from '@/domain/product/product.normalize';
import { matchVariant, pickDisplayVariant } from '@/domain/variant/variant.match';
import { isVariantSelectable } from '@/domain/product/product.guards';
import { resolvePrice } from '@/domain/pricing/pricing.engine';
import { formatPrice } from '@/utils/priceUtils';

import { useRecommendationStore } from '@/store/useRecommendationStore';
import { useTracking } from '@/hooks/useTracking';
import { PRODUCT_DETAILS_CONFIG, COLORS } from '@/constants/productDetails';
import type { LightColors, DarkColors } from '@/theme';

import { ProductHeader } from '@/components/ProductDetails/ProductHeader';
import { ProductImageCarousel } from '@/components/ProductDetails/ProductImageCarousel';
import { ProductAttributes } from '@/components/ProductDetails/ProductAttributes';
import Review from '@/components/Review';
import { ProductRecommendations } from '@/components/ProductDetails/ProductRecommendations';
import { ProductActions } from '@/components/ProductDetails/ProductActions';
import { ZoomableImage } from '@/components/ProductDetails/ZoomableImageModal';
import { ProductDetailsSkeleton } from '@/components/ProductDetails/ProductDetailsSkeleton';

// ─── Collapsible Description ─────────────────────────────────────────────────

interface CollapsibleDescriptionProps {
  text: string;
  colors: LightColors | DarkColors;
}

const CollapsibleDescription = memo(({ text, colors }: CollapsibleDescriptionProps) => {
  const [expanded, setExpanded] = useState(false);
  const rotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggle = () => {
    const next = !expanded;
    rotation.value = withTiming(next ? 180 : 0, { duration: 220 });
    setExpanded(next);
  };

  return (
    <View style={[descStyles.container, { backgroundColor: colors.cardBackground }]}>
      <TouchableOpacity
        onPress={toggle}
        style={descStyles.header}
        activeOpacity={0.7}
      >
        <Text style={[descStyles.title, { color: colors.text.gray }]}>
          {i18n.t('description') || 'Details'}
        </Text>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={colors.text.mediumGray} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View entering={FadeIn.duration(200)}>
          <Text style={[descStyles.body, { color: colors.text.mediumGray }]}>{text}</Text>
        </Animated.View>
      )}
    </View>
  );
});
CollapsibleDescription.displayName = 'CollapsibleDescription';

const descStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
  },
});

// ─── Section keys ─────────────────────────────────────────────────────────────

const SECTIONS = [
  'CAROUSEL',
  'INFO',
  'ATTRIBUTES',
  'DESCRIPTION',
  'RECOMMENDATIONS',
  'REVIEWS',
] as const;

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function Details() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = params.details ? String(params.details) : '';

  const initialData = useMemo(() => {
    if (!productId) return undefined;
    const name = params.name ? String(params.name) : undefined;
    const priceStr = params.price ? String(params.price) : undefined;
    const image = params.image ? String(params.image) : undefined;
    if (!name && !priceStr && !image) return undefined;
    return {
      id: productId,
      name,
      images: image ? [image] : [],
      price: priceStr ? Number(priceStr) : undefined,
    };
  }, [productId, params.name, params.price, params.image]);

  useLayoutEffect(() => {
    if (productId && __DEV__) markScreenMount(productId);
  }, [productId]);

  const { product, isLoading, error } = useProductFetch(productId, initialData);
  const { addToWishlist, removeFromWishlist } = useWishlistActions();
  const { trackEvent } = useTracking();

  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDeferred, setShowDeferred] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartAttempted, setCartAttempted] = useState(false);

  const lastTrackedRef = useRef<string | null>(null);

  // Content fade-in on mount
  const contentOpacity = useSharedValue(0);
  const contentFadeStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(() => {
      if (!cancelled) {
        contentOpacity.value = withTiming(1, { duration: 350 });
        setShowDeferred(true);
        logPerf(productId, 'HEAVY_SECTIONS_START');
      }
    });
    return () => { cancelled = true; };
  }, [productId]);

  // Recommendations
  const {
    productRecommendations,
    isProductRecommendationsLoading,
    fetchProductRecommendations,
  } = useRecommendationStore();
  const recommendations = productRecommendations[productId];
  const isLoadingRecommendations = isProductRecommendationsLoading[productId];

  useEffect(() => {
    if (!productId || !showDeferred) return;
    const task = InteractionManager.runAfterInteractions(() => {
      fetchProductRecommendations(productId);
    });
    return () => task.cancel();
  }, [productId, fetchProductRecommendations, showDeferred]);

  useEffect(() => {
    const id = (product as any)?.id;
    if (!id || !showDeferred) return;
    if (lastTrackedRef.current === id) return;
    lastTrackedRef.current = id;
    Promise.resolve().then(() => {
      trackEvent('product_view', { productId: id, screen: 'product_details' });
    });
  }, [(product as any)?.id, trackEvent, showDeferred]);

  const viewProduct = product as NormalizedProduct | null;

  const optionsMap = useMemo(
    () => (viewProduct ? getAttributeOptions(viewProduct) : {}),
    [viewProduct]
  );

  const productAttributes = useMemo(() => {
    if (!viewProduct) return [];
    if (viewProduct.attributeDefs && viewProduct.attributeDefs.length > 0) {
      return viewProduct.attributeDefs;
    }
    return Object.keys(optionsMap).map(key => ({
      name: key,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
      required: true,
    }));
  }, [viewProduct, optionsMap]);

  const normalizedSelection = useMemo(
    () => normalizeSelectedAttributes(selectedAttributes),
    [selectedAttributes]
  );

  useEffect(() => {
    if (!productAttributes.length) return;
    setSelectedAttributes(prev => {
      const next: SelectedAttributes = { ...prev };
      let changed = false;
      for (const attr of productAttributes) {
        const key = String(attr.name ?? '').trim().toLowerCase();
        const options = optionsMap[key] || [];
        if (attr.required && options.length === 1 && !(next as any)[key]) {
          (next as any)[key] = options[0]!;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [productAttributes, optionsMap]);

  const matchingVariant = useMemo(
    () => (viewProduct ? matchVariant(viewProduct, normalizedSelection) : null),
    [viewProduct, normalizedSelection]
  );

  const displayVariant = useMemo(() => {
    if (!viewProduct) return null;
    if (matchingVariant) return matchingVariant;

    const selKeys = Object.keys(normalizedSelection);
    if (selKeys.length > 0) {
      const variants = Array.isArray(viewProduct.variants) ? viewProduct.variants : [];
      for (const v of variants) {
        if (v.isActive === false) continue;
        const attrs = v.attributes || {};
        let ok = true;
        for (const k of selKeys) {
          if (!attrs[k] || String(attrs[k]) !== String(normalizedSelection[k])) {
            ok = false;
            break;
          }
        }
        if (ok) return v as any;
      }
    }

    const picked = pickDisplayVariant(viewProduct);
    return picked || null;
  }, [viewProduct, matchingVariant, normalizedSelection]);

  const productImages = useMemo(() => {
    if (!viewProduct) return [];
    const variantImages =
      displayVariant?.images?.length > 0 ? displayVariant.images : [];
    const mainImages = viewProduct.images || [];
    const images = variantImages.length > 0 ? variantImages : mainImages;
    return Array.from(new Set(images)).filter(
      (img): img is string => !!img && typeof img === 'string'
    );
  }, [viewProduct, displayVariant?.images]);

  useEffect(() => {
    if (!productImages?.length) return;
    const task = InteractionManager.runAfterInteractions(() => {
      const first = productImages[0];
      if (first) RNImage.prefetch(first).catch(() => {});
      setTimeout(() => {
        try {
          productImages
            .slice(
              PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX,
              PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX +
                PRODUCT_DETAILS_CONFIG.PREFETCH_IMAGE_COUNT
            )
            .forEach((uri: string) => uri && RNImage.prefetch(uri).catch(() => {}));
        } catch {}
      }, 100);
    });
    return () => task.cancel();
  }, [productImages]);

  useEffect(() => {
    if (!displayVariant) return;
    if (Object.keys(selectedAttributes || {}).length > 0) return;
    const attrs = displayVariant.attributes || {};
    const lower: SelectedAttributes = {};
    Object.entries(attrs).forEach(([k, v]) => {
      const key = String(k).trim().toLowerCase();
      const val = String(v ?? '').trim();
      if (key && val) (lower as any)[key] = val;
    });
    if (Object.keys(lower).length > 0) setSelectedAttributes(lower);
  }, [displayVariant, selectedAttributes]);

  const pricing = useMemo(
    () =>
      viewProduct
        ? resolvePrice({
            product: viewProduct,
            selectedVariant: matchingVariant || displayVariant,
          })
        : null,
    [viewProduct, matchingVariant, displayVariant]
  );

  const currentPrice = pricing?.final ?? 0;
  const originalPrice = pricing?.original ?? pricing?.merchant ?? 0;
  const productHasDiscount = (pricing?.discount?.amount ?? 0) > 0;
  const discountPct = Math.round(
    (viewProduct as any)?.displayDiscountPercentage ||
      pricing?.discount?.percentage ||
      0
  );

  const formattedFinalPrice = useMemo(() => formatPrice(currentPrice), [currentPrice]);
  const formattedOriginalPrice = useMemo(
    () => (productHasDiscount ? formatPrice(originalPrice) : ''),
    [originalPrice, productHasDiscount]
  );

  const currentStock = useMemo(() => {
    if (displayVariant) return displayVariant.stock ?? 0;
    if (viewProduct?.simple?.stock != null) return Number(viewProduct.simple.stock ?? 0);
    return 0;
  }, [displayVariant, viewProduct]);

  const missingRequiredAttributes = useMemo(() => {
    if (!productAttributes.length) return [];
    const missing: string[] = [];
    for (const attr of productAttributes) {
      const key = String(attr.name ?? '').trim().toLowerCase();
      if (!attr.required) continue;
      const val = (normalizedSelection as any)[key];
      if (!val || String(val).trim().length === 0) missing.push(attr.displayName || attr.name);
    }
    return missing;
  }, [productAttributes, normalizedSelection]);

  const canAddToCart = useMemo(() => {
    if (!viewProduct) return false;
    if ((viewProduct as any)?.isActive === false) return false;
    if (missingRequiredAttributes.length > 0) return false;
    const isSingleVariantSimple =
      viewProduct.variants.length === 1 && productAttributes.length === 0;
    if (viewProduct.variants.length > 0) {
      if (!matchingVariant && !isSingleVariantSimple) return false;
      const target =
        matchingVariant || (isSingleVariantSimple ? viewProduct.variants[0] : null);
      return isVariantSelectable(target);
    }
    return Number(viewProduct.simple?.stock ?? 0) > 0;
  }, [viewProduct, missingRequiredAttributes.length, matchingVariant, productAttributes.length]);

  const inWishlist = useIsInWishlist(viewProduct?.id);

  const handleWishlistPress = useCallback(async () => {
    if (!viewProduct?.id || wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (inWishlist) await removeFromWishlist(viewProduct.id);
      else await addToWishlist({ ...(viewProduct as any), _id: viewProduct.id });
    } catch (e) {
      console.error('wishlist error:', e);
    } finally {
      setWishlistLoading(false);
    }
  }, [viewProduct?.id, wishlistLoading, inWishlist, removeFromWishlist, addToWishlist]);

  const openImageModal = useCallback((uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  }, []);
  const closeImageModal = useCallback(() => setModalVisible(false), []);

  const handleAttributeSelect = useCallback((attrName: string, value: string) => {
    const keyLower = attrName.trim().toLowerCase();
    setSelectedAttributes(prev => {
      if ((prev as any)[keyLower] === value) return prev;
      return { ...prev, [keyLower]: value };
    });
  }, []);

  const flatListExtraData = useMemo(
    () => ({
      selectedAttributes,
      viewProductId: viewProduct?.id ?? null,
      displayVariantId: (displayVariant as any)?._id ?? null,
      pricingFinal: pricing?.final ?? null,
      currentStock,
      missingCount: missingRequiredAttributes.length,
      showDeferred,
      recsCount: (recommendations as any)?.length ?? 0,
      isLoadingRecs: isLoadingRecommendations ?? false,
      cartAttempted,
      themeMode: theme.mode,
    }),
    [
      selectedAttributes,
      viewProduct?.id,
      (displayVariant as any)?._id,
      pricing?.final,
      currentStock,
      missingRequiredAttributes.length,
      showDeferred,
      (recommendations as any)?.length,
      isLoadingRecommendations,
      cartAttempted,
      theme.mode,
    ]
  );

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      switch (item) {
        case 'CAROUSEL':
          return (
            <ProductImageCarousel
              images={productImages || []}
              colors={colors}
              onImagePress={openImageModal}
            />
          );

        case 'INFO':
          return viewProduct ? (
            <View style={[styles.infoSection, { backgroundColor: colors.cardBackground }]}>
              {/* Category */}
              {!!viewProduct.categoryName && (
                <Text
                  style={[
                    styles.categoryText,
                    { color: colors.primary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                  ]}
                >
                  {viewProduct.categoryName}
                </Text>
              )}

              {/* Name */}
              <Text
                style={[
                  styles.productName,
                  { color: colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {viewProduct.name}
              </Text>

              {/* Price row */}
              <View style={styles.priceRow}>
                {pricing?.requiresSelection && !isLoading && (
                  <Text style={[styles.fromText, { color: colors.text.veryLightGray }]}>
                    {i18n.t('from') || 'From'}{'  '}
                  </Text>
                )}
                <Text
                  style={[
                    styles.finalPrice,
                    { color: productHasDiscount ? colors.danger : colors.text.gray },
                  ]}
                >
                  {formattedFinalPrice}
                </Text>
                {productHasDiscount && (
                  <>
                    <Text style={[styles.originalPrice, { color: colors.text.veryLightGray }]}>
                      {formattedOriginalPrice}
                    </Text>
                    {discountPct > 0 && (
                      <View style={[styles.discountBadge, { backgroundColor: colors.danger }]}>
                        <Text style={styles.discountText}>-{discountPct}%</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Stock indicator */}
              <View style={styles.stockRow}>
                {currentStock > 5 ? (
                  <View style={styles.stockInner}>
                    <View style={[styles.stockDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.stockLabel, { color: colors.success }]}>
                      {i18n.t('inStock') || 'In Stock'}
                    </Text>
                  </View>
                ) : currentStock > 0 ? (
                  <View style={styles.stockInner}>
                    <View style={[styles.stockDot, { backgroundColor: colors.warning }]} />
                    <Text style={[styles.stockLabel, { color: colors.warning }]}>
                      {`${i18n.t('only') || 'Only'} ${currentStock} ${i18n.t('left') || 'left'}`}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.stockInner}>
                    <View style={[styles.stockDot, { backgroundColor: colors.danger }]} />
                    <Text style={[styles.stockLabel, { color: colors.danger }]}>
                      {i18n.t('outOfStock') || 'Out of Stock'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Missing attr warning */}
              {cartAttempted && missingRequiredAttributes.length > 0 && (
                <Text style={[styles.missingText, { color: colors.danger }]}>
                  {`${i18n.t('pleaseSelect') || 'Please select'}: ${missingRequiredAttributes.join(', ')}`}
                </Text>
              )}

              {/* SKU */}
              {displayVariant?.sku && (
                <Text style={[styles.skuText, { color: colors.text.veryLightGray }]}>
                  SKU: {displayVariant.sku}
                </Text>
              )}
            </View>
          ) : null;

        case 'ATTRIBUTES':
          return viewProduct ? (
            <View>
              <View style={[styles.sectionDivider, { backgroundColor: colors.background }]} />
              <ProductAttributes
                product={viewProduct}
                selectedAttributes={selectedAttributes}
                onAttributeSelect={handleAttributeSelect}
                themeColors={colors}
                pleaseSelectText={i18n.t('pleaseSelect') || 'Please select'}
              />
            </View>
          ) : null;

        case 'DESCRIPTION':
          return viewProduct?.description ? (
            <>
              <View style={[styles.sectionDivider, { backgroundColor: colors.background }]} />
              <CollapsibleDescription text={viewProduct.description} colors={colors} />
            </>
          ) : null;

        case 'RECOMMENDATIONS':
          return showDeferred ? (
            <View>
              <View style={[styles.sectionDivider, { backgroundColor: colors.background }]} />
              <ProductRecommendations
                recommendations={(recommendations as any) ?? null}
                isLoading={isLoadingRecommendations ?? false}
                colors={colors}
              />
            </View>
          ) : null;

        case 'REVIEWS':
          return showDeferred && viewProduct?.id ? (
            <View>
              <View style={[styles.sectionDivider, { backgroundColor: colors.background }]} />
              <Review productId={viewProduct.id} />
              <View style={{ height: 130 }} />
            </View>
          ) : null;

        default:
          return null;
      }
    },
    [
      productImages,
      colors,
      openImageModal,
      viewProduct,
      productHasDiscount,
      pricing,
      formattedFinalPrice,
      formattedOriginalPrice,
      discountPct,
      currentStock,
      missingRequiredAttributes,
      selectedAttributes,
      handleAttributeSelect,
      showDeferred,
      recommendations,
      isLoadingRecommendations,
      displayVariant,
      cartAttempted,
      isLoading,
    ]
  );

  // ── Guards ──────────────────────────────────────────────────────────────────

  const isInitializing = !viewProduct?.id || isLoading;
  if (isInitializing && !error) {
    return <ProductDetailsSkeleton colors={colors} />;
  }

  if (error && !viewProduct) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.cardBackground }]}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text.gray }]}>
          {i18n.t('errorLoadingProduct') || 'Could not load product'}
        </Text>
        <Text style={[styles.errorSub, { color: colors.text.veryLightGray }]}>
          {String(error)}
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={[styles.backBtnText, { color: colors.text.white }]}>
            {i18n.t('backToHome') || 'Back to Home'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!viewProduct?.id && !isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.cardBackground }]}>
        <Ionicons name="search-outline" size={56} color={colors.text.veryLightGray} />
        <Text style={[styles.errorTitle, { color: colors.text.gray }]}>
          {i18n.t('noProductAvailable') || 'Product not found'}
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={[styles.backBtnText, { color: colors.text.white }]}>
            {i18n.t('backToHome') || 'Back to Home'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <Animated.View style={[{ flex: 1 }, contentFadeStyle]}>
        <FlatList
          data={SECTIONS}
          renderItem={renderItem}
          keyExtractor={item => item}
          showsVerticalScrollIndicator={false}
          bounces={Platform.OS === 'ios'}
          alwaysBounceVertical={false}
          removeClippedSubviews
          initialNumToRender={4}
          maxToRenderPerBatch={3}
          windowSize={5}
          extraData={flatListExtraData}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>

      {/* Floating overlay header */}
      <ProductHeader
        inWishlist={inWishlist}
        wishlistLoading={wishlistLoading}
        onWishlistPress={handleWishlistPress}
      />

      {/* Sticky Add to Cart */}
      <ProductActions
        product={viewProduct as any}
        selectedAttributes={normalizedSelection}
        isAvailable={canAddToCart}
        themeColors={colors}
        onAttempt={() => setCartAttempted(true)}
      />

      {/* Fullscreen zoom modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={closeImageModal}>
            <Ionicons name="close" size={26} color={colors.text.white} />
          </TouchableOpacity>
          {selectedImage && <ZoomableImage uri={selectedImage} />}
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 110 },

  // Info section
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  fromText: {
    fontSize: 14,
    fontWeight: '500',
  },
  finalPrice: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'line-through',
   lineHeight: 20,
  },
  discountBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stockRow: { marginBottom: 8 },
  stockInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stockDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stockLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  missingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  skuText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },

  // Section divider
  sectionDivider: { height: 8 },

  // Error / empty states
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    borderRadius: 30,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 8,
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.MODAL_BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 2,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
  },
});
