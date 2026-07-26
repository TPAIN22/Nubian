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
  Platform,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  AppText,
  Badge,
  EmptyState,
  Price,
  Rating,
  Screen,
  Touchable,
} from '@/components/ui/kit';
import { iconSize, spacing } from '@/theme/tokens';
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
import { formatPrice, formatMoney, getProductFinalMoney, getProductOriginalMoney } from '@/utils/priceUtils';

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
import { StockIndicator } from '@/components/cart/StockIndicator';
import { LOW_STOCK_THRESHOLD, type StockLevel } from '@/components/cart/useAddToCart';
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
      <Touchable
        onPress={toggle}
        scaleTo={1}
        style={descStyles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={i18n.t('description') || 'Details'}
      >
        <AppText variant="subtitle" tone="title">
          {i18n.t('description') || 'Details'}
        </AppText>
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={iconSize.md} color={colors.text.muted} />
        </Animated.View>
      </Touchable>

      {expanded && (
        <Animated.View entering={FadeIn.duration(200)}>
          <AppText variant="body" tone="body" style={descStyles.body}>
            {text}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
});
CollapsibleDescription.displayName = 'CollapsibleDescription';

const descStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Keeps the whole header row a 44pt target even though the chevron is 20pt.
    minHeight: 44,
  },
  body: {
    marginTop: spacing.md,
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
      // Prefetch into expo-image's cache — the same cache the gallery renders
      // from. (Previously used RN's Image.prefetch, which warms a cache the UI
      // never reads, so the gallery still flashed a load on first swipe.)
      const first = productImages[0];
      if (first) ExpoImage.prefetch(first).catch(() => {});
      setTimeout(() => {
        try {
          productImages
            .slice(
              PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX,
              PRODUCT_DETAILS_CONFIG.PREFETCH_START_INDEX +
                PRODUCT_DETAILS_CONFIG.PREFETCH_IMAGE_COUNT
            )
            .forEach((uri: string) => uri && ExpoImage.prefetch(uri).catch(() => {}));
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

  // When entering from an order line, the caller passes the purchased variant
  // id. Seed selectedAttributes from that variant so the price/stock the
  // screen shows matches what the customer actually ordered, instead of
  // defaulting to whichever variant pickDisplayVariant returns first.
  const requestedVariantId = params.variantId ? String(params.variantId) : '';
  const requestedVariantSeededRef = useRef(false);
  useEffect(() => {
    if (requestedVariantSeededRef.current) return;
    if (!requestedVariantId || !viewProduct) return;
    const variant = (viewProduct.variants || []).find(
      (v: any) => String(v?._id ?? v?.id ?? '') === requestedVariantId
    );
    if (!variant) return;
    const attrs = (variant as any).attributes || {};
    const lower: SelectedAttributes = {};
    Object.entries(attrs).forEach(([k, v]) => {
      const key = String(k).trim().toLowerCase();
      const val = String(v ?? '').trim();
      if (key && val) (lower as any)[key] = val;
    });
    if (Object.keys(lower).length > 0) {
      setSelectedAttributes(lower);
      requestedVariantSeededRef.current = true;
    }
  }, [requestedVariantId, viewProduct]);

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

  // Prefer the typed Money envelope from the backend (currency-aware,
  // pre-formatted). Fall back to the legacy resolved-price chain for payloads
  // that don't carry an envelope yet.
  const finalMoney = getProductFinalMoney(viewProduct, matchingVariant || displayVariant);
  const originalMoney = getProductOriginalMoney(viewProduct, matchingVariant || displayVariant);

  const currentPrice = finalMoney?.amount ?? pricing?.final ?? 0;
  const originalPrice = originalMoney?.amount ?? pricing?.original ?? pricing?.merchant ?? 0;
  const productHasDiscount = (pricing?.discount?.amount ?? 0) > 0 || (originalPrice > currentPrice);
  const discountPct = Math.round(
    (viewProduct as any)?.displayDiscountPercentage ||
      (viewProduct as any)?.price?.discountPercentage ||
      pricing?.discount?.percentage ||
      0
  );

  const formattedFinalPrice = useMemo(
    () => (finalMoney ? formatMoney(finalMoney) : formatPrice(currentPrice)),
    [finalMoney, currentPrice]
  );
  const formattedOriginalPrice = useMemo(
    () => {
      if (!productHasDiscount) return '';
      return originalMoney ? formatMoney(originalMoney) : formatPrice(originalPrice);
    },
    [originalMoney, originalPrice, productHasDiscount]
  );

  const currentStock = useMemo(() => {
    if (displayVariant) return displayVariant.stock ?? 0;
    if (viewProduct?.simple?.stock != null) return Number(viewProduct.simple.stock ?? 0);
    return 0;
  }, [displayVariant, viewProduct]);

  // Same `> 5` rule the screen has always used, now expressed through the
  // shared threshold so the sticky bar and the info block can't disagree.
  const stockLevel = useMemo<StockLevel>(() => {
    if (currentStock > LOW_STOCK_THRESHOLD) return 'inStock';
    if (currentStock > 0) return 'lowStock';
    return 'outOfStock';
  }, [currentStock]);

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

  // Rating is optional on the payload — rendered only when the backend sends
  // one, never as an empty five-star placeholder.
  const productRating: number =
    (viewProduct as any)?.averageRating ?? (viewProduct as any)?.rating ?? 0;

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

  // Stable identity: an inline arrow re-rendered the memoised sticky bar on
  // every parent render.
  const handleCartAttempt = useCallback(() => setCartAttempted(true), []);

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
              {/* Category + rating share a row so the metadata reads as one
                  quiet band above the name rather than two stacked lines. */}
              {(!!viewProduct.categoryName || productRating > 0) && (
                <View style={styles.metaRow}>
                  {!!viewProduct.categoryName && (
                    <Badge label={viewProduct.categoryName} tone="primary" size="sm" />
                  )}
                  {productRating > 0 && <Rating value={productRating} size="sm" />}
                </View>
              )}

              {/* Name — the second thing read, after the photo. */}
              <AppText variant="pageTitle" tone="title" style={styles.productName}>
                {viewProduct.name}
              </AppText>

              {/* Price block. The saving is spelled out next to the discount
                  badge — "-30%" alone makes the shopper do the arithmetic. */}
              <View style={styles.priceRow}>
                <Price
                  value={formattedFinalPrice}
                  original={productHasDiscount ? formattedOriginalPrice : null}
                  isFrom={Boolean(pricing?.requiresSelection) && !isLoading}
                  size="lg"
                />
                {productHasDiscount && discountPct > 0 && (
                  <Badge label={`-${discountPct}%`} tone="sale" variant="solid" />
                )}
              </View>

              {/* Stock indicator — shared component, same data, same rule */}
              <View style={styles.stockRow}>
                <StockIndicator level={stockLevel} stock={currentStock} />
              </View>

              {/* Missing attr warning */}
              {cartAttempted && missingRequiredAttributes.length > 0 && (
                <Animated.View entering={FadeIn.duration(180)} style={styles.missingRow}>
                  <Ionicons name="alert-circle" size={iconSize.sm} color={colors.error} />
                  <AppText variant="caption" tone="error" style={styles.missingText}>
                    {`${i18n.t('pleaseSelect') || 'Please select'}: ${missingRequiredAttributes.join(', ')}`}
                  </AppText>
                </Animated.View>
              )}

              {/* SKU */}
              {displayVariant?.sku && (
                <AppText variant="micro" tone="subtle" style={styles.skuText}>
                  SKU: {displayVariant.sku}
                </AppText>
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
                highlightMissing={cartAttempted}
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
      productRating,
      productHasDiscount,
      pricing,
      formattedFinalPrice,
      formattedOriginalPrice,
      discountPct,
      currentStock,
      stockLevel,
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
      <Screen style={styles.centered}>
        <EmptyState
          tone="error"
          icon="alert-circle-outline"
          title={i18n.t('errorLoadingProduct') || 'Could not load product'}
          description={String(error)}
          actionLabel={i18n.t('backToHome') || 'Back to Home'}
          onAction={() => router.replace('/(tabs)')}
        />
      </Screen>
    );
  }

  if (!viewProduct?.id && !isLoading) {
    return (
      <Screen style={styles.centered}>
        <EmptyState
          icon="search-outline"
          title={i18n.t('noProductAvailable') || 'Product not found'}
          actionLabel={i18n.t('backToHome') || 'Back to Home'}
          onAction={() => router.replace('/(tabs)')}
        />
      </Screen>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    // The canvas, not white: the 8pt `sectionDivider` bands between the info,
    // attributes, description, recommendation and review cards now show as grey
    // gaps. On the old white background those dividers were invisible, which is
    // why the page read as one undifferentiated column.
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        onAttempt={handleCartAttempt}
        imageUri={productImages[0] ?? null}
        stockLevel={stockLevel}
        stock={currentStock}
        priceLabel={formattedFinalPrice}
        originalPriceLabel={productHasDiscount ? formattedOriginalPrice : null}
      />

      {/* Fullscreen zoom modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <GestureHandlerRootView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={closeImageModal}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('close') || 'Close'}
          >
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
  // Clears the sticky purchase bar plus a section gap, so the last review is
  // never trapped behind the CTA.
  listContent: { paddingBottom: 140 },

  // Info section
  infoSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  productName: {
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  stockRow: { flexDirection: 'row' },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  missingText: {
    flex: 1,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  skuText: {
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },

  // Canvas-coloured band between white content cards.
  sectionDivider: { height: spacing.sm },

  // Error / empty states
  centered: {
    justifyContent: 'center',
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
    end: spacing.lg,
    zIndex: 2,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22,
  },
});
