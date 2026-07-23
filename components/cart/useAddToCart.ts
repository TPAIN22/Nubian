/**
 * `useAddToCart` — all of the add-to-cart *behaviour*, extracted verbatim from
 * the old `components/AddToCartButton.tsx`.
 *
 * Nothing here is new business logic. Attribute merging, required-attribute
 * validation, variant matching, availability rules, the auth gate, the store
 * mutation, the analytics event and the post-add `fetchCart()` reconciliation
 * are the same calls in the same order as before. What the hook adds is a
 * presentation-facing state machine (`idle → loading → success → idle`) plus
 * the feedback signals (haptics, flight, confirmation card) that the UI layer
 * needs, so the button component can be purely visual.
 *
 * Every call site — product details CTA, bottom sheet, product-card quick add —
 * goes through this one hook, which is why they can no longer drift apart.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

import useCartStore from '@/store/useCartStore';
import useItemStore from '@/store/useItemStore';
import { useTracking } from '@/hooks/useTracking';
import { matchVariant } from '@/domain/variant/variant.match';
import { isVariantSelectable } from '@/domain/product/product.guards';
import type { NormalizedProduct } from '@/domain/product/product.normalize';
import type { SelectedAttributes } from '@/domain/product/product.selectors';
import {
  validateRequiredAttributes,
  mergeSizeAndAttributes,
  normalizeAttributes,
} from '@/utils/cartUtils';
import { cleanImages } from '@/utils/productUtils';
import { toast } from '@/utils/toast';

import { cartStrings as S } from './strings';
import {
  blockedHaptic,
  commitHaptic,
  errorHaptic,
  successHaptic,
} from './haptics';
import { flyToCart, showCartConfirmation, type Rect } from './cartFeedback';

/** Matches the threshold the product-details screen has always used. */
export const LOW_STOCK_THRESHOLD = 5;

/** How long the button holds its success state before returning to idle. */
export const SUCCESS_HOLD_MS = 1400;

export type AddToCartStatus = 'idle' | 'loading' | 'success' | 'error';

/** What the button should render. Derived, never stored. */
export type AddToCartVisualState =
  | 'default'
  | 'loading'
  | 'success'
  | 'outOfStock'
  | 'selectOptions'
  | 'disabled';

export type StockLevel = 'inStock' | 'lowStock' | 'outOfStock' | 'unknown';

export type UseAddToCartOptions = {
  product: NormalizedProduct;
  /** Legacy single-select size, merged into `attributes` exactly as before. */
  selectedSize?: string;
  selectedAttributes?: SelectedAttributes;
  /** External disable (e.g. the details screen's `isAvailable` gate). */
  disabled?: boolean;
  /** Fired on every press, including blocked ones — used for "user tried". */
  onPressAttempt?: () => void;
  /** Analytics `screen` dimension. Defaults to the historical value. */
  screen?: string;
  /** Quantity to add. Defaults to 1 (the only value used previously). */
  quantity?: number;
  /** Measured to launch the fly-to-cart animation from the right place. */
  sourceRef?: RefObject<View | null>;
  /** Overrides the product image used by the flight + confirmation card. */
  imageUri?: string | null;
  /** Set false to skip the flight / confirmation card (e.g. inside the cart). */
  richFeedback?: boolean;
  /** Called after a successful add, once the store has settled. */
  onSuccess?: () => void;
  /** Called when the add fails, after the error toast is shown. */
  onError?: (error: unknown) => void;
  /**
   * Called instead of adding when the product needs an attribute selection the
   * current surface can't make (product cards). When omitted the historical
   * behaviour — a toast asking for a selection — is preserved.
   */
  onNeedsSelection?: () => void;
};

export type UseAddToCartResult = {
  status: AddToCartStatus;
  isLoading: boolean;
  isButtonDisabled: boolean;
  visualState: AddToCartVisualState;
  availability: { ok: boolean; reason: AvailabilityReason };
  disabledReason: string | null;
  missingAttributes: string[];
  matchingVariant: ReturnType<typeof matchVariant>;
  /** Units available for the resolved variant / simple product, or null. */
  stock: number | null;
  stockLevel: StockLevel;
  imageUri: string | null;
  addToCart: () => Promise<void>;
};

type AvailabilityReason =
  | 'ok'
  | 'no_product'
  | 'inactive_product'
  | 'missing_required'
  | 'no_variant'
  | 'out_of_stock';

export function useAddToCart({
  product,
  selectedSize,
  selectedAttributes,
  disabled,
  onPressAttempt,
  screen = 'product_details',
  quantity = 1,
  sourceRef,
  imageUri: imageUriProp,
  richFeedback = true,
  onSuccess,
  onError,
  onNeedsSelection,
}: UseAddToCartOptions): UseAddToCartResult {
  const { addToCart, clearError, fetchCart } = useCartStore();
  const { isSignedIn, isLoaded: isAuthLoaded } = useUser();
  const { setSignInModelVisible } = useItemStore();
  const { trackEvent } = useTracking();
  const router = useRouter();

  const [status, setStatus] = useState<AddToCartStatus>('idle');
  const isLoading = status === 'loading';

  // Guards against setState-after-unmount when the user navigates away mid-add.
  const mountedRef = useRef(true);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // ── 1) Merge + normalize (unchanged) ──────────────────────────────────────
  const mergedAttributes = useMemo(() => {
    const merged = mergeSizeAndAttributes(selectedSize, selectedAttributes);
    return normalizeAttributes(merged);
  }, [selectedSize, selectedAttributes]);

  const hasVariants = !!(product?.variants && product.variants.length > 0);
  const simpleStock = Number(product?.simple?.stock ?? 0);

  // ── 2) Required validation (unchanged) ────────────────────────────────────
  const requiredValidation = useMemo(
    () => validateRequiredAttributes(product?.attributeDefs, mergedAttributes),
    [product?.attributeDefs, mergedAttributes],
  );

  // ── 3) Find matching variant once (unchanged) ─────────────────────────────
  const matchingVariant = useMemo(() => {
    if (!hasVariants) return null;
    return matchVariant(product, mergedAttributes);
  }, [hasVariants, product, mergedAttributes]);

  // Single-variant products with no attribute defs behave like simple ones.
  const isActuallySimple = useMemo(
    () =>
      product?.variants?.length === 1 &&
      (!product?.attributeDefs || product.attributeDefs.length === 0),
    [product?.variants?.length, product?.attributeDefs],
  );

  // ── 4) Availability (unchanged) ───────────────────────────────────────────
  const availability = useMemo((): { ok: boolean; reason: AvailabilityReason } => {
    if (!product) return { ok: false, reason: 'no_product' };
    if ((product as any).isActive === false) {
      return { ok: false, reason: 'inactive_product' };
    }

    if (hasVariants) {
      if (!requiredValidation.valid) return { ok: false, reason: 'missing_required' };
      if (!matchingVariant && !isActuallySimple) {
        return { ok: false, reason: 'no_variant' };
      }
      const target =
        matchingVariant || (isActuallySimple ? product.variants[0] : null);
      if (!isVariantSelectable(target)) return { ok: false, reason: 'out_of_stock' };
      return { ok: true, reason: 'ok' };
    }

    if (simpleStock > 0) return { ok: true, reason: 'ok' };
    return { ok: false, reason: 'out_of_stock' };
  }, [
    product,
    hasVariants,
    requiredValidation.valid,
    matchingVariant,
    isActuallySimple,
    simpleStock,
  ]);

  // ── 5) Disabled (unchanged) ───────────────────────────────────────────────
  const isButtonDisabled = useMemo(
    () => !!disabled || isLoading || !availability.ok,
    [disabled, isLoading, availability.ok],
  );

  const disabledReason = useMemo(() => {
    if (!product) return 'No product';
    if (isLoading) return 'Loading...';
    if (disabled) return 'Disabled';

    switch (availability.reason) {
      case 'missing_required':
        return `Missing: ${requiredValidation.missing.join(', ')}`;
      case 'no_variant':
        return 'Please select a valid combination';
      case 'out_of_stock':
        return 'Out of stock';
      case 'inactive_product':
        return 'Product inactive';
      default:
        return null;
    }
  }, [product, isLoading, disabled, availability.reason, requiredValidation.missing]);

  // ── Stock, derived only from data the product already carries ─────────────
  const stock = useMemo<number | null>(() => {
    if (!product) return null;
    if (hasVariants) {
      const target =
        matchingVariant || (isActuallySimple ? product.variants[0] : null);
      if (!target) return null;
      const n = Number((target as any)?.stock);
      return Number.isFinite(n) ? n : null;
    }
    const raw = product?.simple?.stock;
    if (raw == null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [product, hasVariants, matchingVariant, isActuallySimple]);

  const stockLevel = useMemo<StockLevel>(() => {
    if ((product as any)?.isActive === false) return 'outOfStock';
    if (stock == null) return 'unknown';
    if (stock <= 0) return 'outOfStock';
    if (stock <= LOW_STOCK_THRESHOLD) return 'lowStock';
    return 'inStock';
  }, [product, stock]);

  const imageUri = useMemo<string | null>(() => {
    if (imageUriProp !== undefined) return imageUriProp;
    const images = cleanImages(product?.images);
    return images[0] ?? null;
  }, [imageUriProp, product?.images]);

  // ── Visual state for the button ───────────────────────────────────────────
  const visualState = useMemo<AddToCartVisualState>(() => {
    if (status === 'loading') return 'loading';
    if (status === 'success') return 'success';
    // The specific reason wins over the caller's blunt `disabled` flag: the
    // details screen passes `disabled={!isAvailable}` for *every* unavailable
    // case, and rendering all of them as a greyed "Add to cart" is exactly the
    // silence this redesign is meant to remove.
    if (availability.reason === 'out_of_stock') return 'outOfStock';
    if (
      availability.reason === 'missing_required' ||
      availability.reason === 'no_variant'
    ) {
      return 'selectOptions';
    }
    if (disabled || !availability.ok) return 'disabled';
    return 'default';
  }, [status, disabled, availability.ok, availability.reason]);

  /** Window-space rect of the press target, captured before any re-layout. */
  const measureSource = useCallback((): Promise<Rect | null> => {
    const node = sourceRef?.current;
    if (!node || typeof (node as any).measureInWindow !== 'function') {
      return Promise.resolve(null);
    }
    return new Promise(resolve => {
      let settled = false;
      const done = (rect: Rect | null) => {
        if (settled) return;
        settled = true;
        resolve(rect);
      };
      // measureInWindow never calls back if the node is detached — don't hang.
      setTimeout(() => done(null), 120);
      try {
        (node as any).measureInWindow(
          (x: number, y: number, width: number, height: number) => {
            if ([x, y, width, height].some(v => typeof v !== 'number' || Number.isNaN(v))) {
              done(null);
              return;
            }
            done({ x, y, width, height });
          },
        );
      } catch {
        done(null);
      }
    });
  }, [sourceRef]);

  // Lets the error toast's "Retry" action call the *latest* handler without
  // making `handleAddToCart` depend on itself.
  const handleAddToCartRef = useRef<(() => Promise<void>) | null>(null);

  const handleAddToCart = useCallback(async () => {
    onPressAttempt?.();

    // ── Blocked paths (same branches, richer presentation) ──────────────────
    if (isButtonDisabled) {
      if (isLoading) return;
      blockedHaptic();

      if (availability.reason === 'missing_required') {
        if (onNeedsSelection) {
          onNeedsSelection();
          return;
        }
        toast.info(S.selectOptions(), {
          description: requiredValidation.missing.length
            ? `${S.pleaseSelect()}: ${requiredValidation.missing.join(', ')}`
            : undefined,
        });
      } else if (availability.reason === 'no_variant') {
        if (onNeedsSelection) {
          onNeedsSelection();
          return;
        }
        toast.info(S.unavailable(), {
          description: S.unavailableCombination(),
        });
      } else if (availability.reason === 'out_of_stock') {
        toast.warning(S.outOfStock(), {
          description: S.outOfStockHint(),
        });
      } else if (availability.reason === 'inactive_product') {
        toast.error(S.productUnavailable());
      } else {
        toast.info(S.selectOptions());
      }
      return;
    }

    try {
      setStatus('loading');
      clearError?.();

      if (!isAuthLoaded) {
        toast.info(S.loading());
        setStatus('idle');
        return;
      }

      if (!isSignedIn) {
        blockedHaptic();
        setSignInModelVisible(true);
        toast.info(S.signInRequired(), {
          action: {
            label: S.signIn(),
            onPress: () => router.push('/(auth)/signin'),
          },
        });
        router.push('/(auth)/signin');
        setStatus('idle');
        return;
      }

      commitHaptic();
      // Kick the measurement off now (the button is on screen and settled) but
      // don't block the request on it — the network call starts in the same
      // tick as the press, exactly as it did before.
      const sourceRectPromise = richFeedback
        ? measureSource()
        : Promise.resolve(null);

      await addToCart(
        product.id,
        quantity,
        mergedAttributes.size || '',
        mergedAttributes,
      );

      trackEvent('add_to_cart', {
        productId: product.id,
        screen,
        ...(hasVariants ? { variantId: matchingVariant?._id ?? null } : {}),
        attributes: mergedAttributes,
      });

      // Server reconciliation, unchanged (fire-and-forget, off the hot path).
      setTimeout(() => {
        fetchCart().catch(() => {});
      }, 100);

      successHaptic();

      if (richFeedback) {
        // Card first — it must not wait on a layout measurement that can only
        // ever be late (or never arrive on a detached node).
        showCartConfirmation({
          title: S.addedToCart(),
          subtitle: (product as any)?.name ?? undefined,
          uri: imageUri,
          onViewCart: () => router.push('/(tabs)/cart'),
        });
        void sourceRectPromise.then(from => flyToCart({ uri: imageUri, from }));
      }

      if (mountedRef.current) {
        setStatus('success');
        if (successTimerRef.current) clearTimeout(successTimerRef.current);
        successTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setStatus('idle');
        }, SUCCESS_HOLD_MS);
      }

      onSuccess?.();
    } catch (err: any) {
      errorHaptic();
      const serverMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message;
      const isNetwork =
        !err?.response ||
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error';

      toast.error(S.addError(), {
        description: isNetwork ? S.checkConnection() : serverMsg || undefined,
        action: { label: S.retry(), onPress: () => void handleAddToCartRef.current?.() },
      });

      if (mountedRef.current) setStatus('idle');
      onError?.(err);
    }
  }, [
    onPressAttempt,
    isButtonDisabled,
    isLoading,
    availability.reason,
    requiredValidation.missing,
    onNeedsSelection,
    clearError,
    isAuthLoaded,
    isSignedIn,
    setSignInModelVisible,
    router,
    richFeedback,
    measureSource,
    addToCart,
    product,
    quantity,
    mergedAttributes,
    trackEvent,
    screen,
    hasVariants,
    matchingVariant?._id,
    fetchCart,
    imageUri,
    onSuccess,
    onError,
  ]);

  handleAddToCartRef.current = handleAddToCart;

  return {
    status,
    isLoading,
    isButtonDisabled,
    visualState,
    availability,
    disabledReason,
    missingAttributes: requiredValidation.missing,
    matchingVariant,
    stock,
    stockLevel,
    imageUri,
    addToCart: handleAddToCart,
  };
}
