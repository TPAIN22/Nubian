import { useState, useMemo, useCallback } from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, View, ActivityIndicator } from "react-native";
import useCartStore from "@/store/useCartStore";
import { useUser } from "@clerk/clerk-expo";
import useItemStore from "@/store/useItemStore";
import i18n from "@/utils/i18n";
import { useTracking } from "@/hooks/useTracking";
import type { SelectedAttributes } from "@/domain/product/product.selectors";
import type { NormalizedProduct } from "@/domain/product/product.normalize";
import { matchVariant } from "@/domain/variant/variant.match";
import { isVariantSelectable } from "@/domain/product/product.guards";
import {
  validateRequiredAttributes,
  mergeSizeAndAttributes,
  normalizeAttributes,
} from "@/utils/cartUtils";
import { toast } from "sonner-native";

type Props = {
  product: NormalizedProduct;
  title?: string;
  buttonStyle?: ViewStyle | any;
  textStyle?: TextStyle;
  disabled?: boolean;
  selectedSize?: string; // legacy
  selectedAttributes?: SelectedAttributes; // new
};

const AddToCartButton = ({
  product,
  title,
  buttonStyle,
  textStyle,
  disabled,
  selectedSize,
  selectedAttributes,
}: Props) => {
  const { addToCart, clearError, fetchCart } = useCartStore();
  const { isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const { setSignInModelVisible } = useItemStore();
  const { trackEvent } = useTracking();

  const buttonTitle = title || i18n.t("addToCart");

  // ✅ 1) Merge + normalize (المصدر النهائي)
  const mergedAttributes = useMemo(() => {
    const merged = mergeSizeAndAttributes(selectedSize, selectedAttributes);
    return normalizeAttributes(merged);
  }, [selectedSize, selectedAttributes]);

  const hasVariants = !!(product?.variants && product.variants.length > 0);
  const simpleStock = Number(product?.simple?.stock ?? 0);

  // ✅ 2) Required validation
  const requiredValidation = useMemo(() => {
    return validateRequiredAttributes(product?.attributeDefs, mergedAttributes);
  }, [product?.attributeDefs, mergedAttributes]);

  // ✅ 3) Find matching variant once (and reuse everywhere)
  const matchingVariant = useMemo(() => {
    if (!hasVariants) return null;
    return matchVariant(product, mergedAttributes);
  }, [hasVariants, product, mergedAttributes]);

  // ✅ 4) Availability based on product/variant
  const availability = useMemo(() => {
    if (!product) return { ok: false, reason: "no_product" as const };

    // product inactive
    if ((product as any).isActive === false) return { ok: false, reason: "inactive_product" as const };

    // If no variants, allow simple product purchase based on stock
    if (!hasVariants) {
      if (simpleStock > 0) return { ok: true, reason: "ok" as const };
      return { ok: false, reason: "out_of_stock" as const };
    }

    // if required missing -> not available yet (needs selection)
    if (!requiredValidation.valid) return { ok: false, reason: "missing_required" as const };

    // no matching variant
    if (!matchingVariant) return { ok: false, reason: "no_variant" as const };

    if (!isVariantSelectable(matchingVariant)) return { ok: false, reason: "out_of_stock" as const };

    return { ok: true, reason: "ok" as const };
  }, [product, hasVariants, requiredValidation.valid, matchingVariant]);

  // ✅ 5) Button disabled
  const isButtonDisabled = useMemo(() => {
    return !!disabled || isLoading || !availability.ok;
  }, [disabled, isLoading, availability.ok]);

  const disabledReason = useMemo(() => {
    if (!product) return "No product";
    if (isLoading) return "Loading...";
    if (disabled) return "Disabled";

    switch (availability.reason) {
      case "missing_required":
        return `Missing: ${requiredValidation.missing.join(", ")}`;
      case "no_variant":
        return "Please select a valid combination";
      case "out_of_stock":
        return "Out of stock";
      case "inactive_product":
        return "Product inactive";
      default:
        return null;
    }
  }, [product, isLoading, disabled, availability.reason, requiredValidation.missing]);

  const handleAddToCart = useCallback(async () => {
    if (isButtonDisabled) {
      // show helpful toast in case user taps fast
      if (!availability.ok) {
        if (availability.reason === "missing_required") {
          toast.info(i18n.t("selectAttributesFirst") || "Please select required attributes", {
            description: requiredValidation.missing.length ? `Missing: ${requiredValidation.missing.join(", ")}` : "",
          });
        } else if (availability.reason === "no_variant") {
          toast.info("Not available", {
            description: "Please select a valid combination of attributes",
          });
        } else if (availability.reason === "out_of_stock") {
          toast.error("Out of stock", {
            description: "Out of stock",
          });
        }
      }
      return;
    }

    try {
      setIsLoading(true);
      clearError?.();

      if (!isSignedIn) {
        setSignInModelVisible(true);
        toast.error(i18n.t("pleaseSignInFirst") || "Please sign in first", {
          description: i18n.t("pleaseSignInFirst") || "Please sign in first",
        },);
        return;
      }

      // ✅ أهم سطر: ابعت نفس attributes اللي اخترتها
      await addToCart(product.id, 1, mergedAttributes.size || "", mergedAttributes);

      trackEvent("add_to_cart", {
        productId: product.id,
        screen: "product_details",
        ...(hasVariants ? { variantId: matchingVariant?._id ?? null } : {}),
        attributes: mergedAttributes,
      });

      setTimeout(() => {
        fetchCart().catch(() => {});
      }, 100);

      toast.success(i18n.t("addedToCart") || "Added to cart", {
        description: i18n.t("addedToCart") || "Added to cart",
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || i18n.t("addToCartError") || "Error";
      toast.error(i18n.t("addToCartError") || "Add to cart error", {
        description: String(msg),
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    isButtonDisabled,
    availability.ok,
    availability.reason,
    requiredValidation.missing,
    isSignedIn,
    setSignInModelVisible,
    clearError,
    addToCart,
    product.id,
    mergedAttributes,
    trackEvent,
    fetchCart,
    hasVariants,
    matchingVariant?._id,
  ]);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, buttonStyle, isButtonDisabled && styles.disabledButton]}
        disabled={isButtonDisabled}
        onPress={handleAddToCart}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFFFF" />
        ) : (
          <View style={styles.buttonContent}>
            <Text style={[styles.text, textStyle]}>{buttonTitle}</Text>
            {__DEV__ && isButtonDisabled && disabledReason ? (
              <Text style={styles.disabledReasonText}>({disabledReason})</Text>
            ) : null}
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  button: {
    backgroundColor: "#f0b745",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  disabledButton: { opacity: 0.7, padding: 14 },
  text: { color: "#FFFFFFFF", fontSize: 18, fontWeight: "bold", textAlign: "center" },
  buttonContent: { alignItems: "center", justifyContent: "center" },
  disabledReasonText: { color: "#FFFFFFFF", fontSize: 10, marginTop: 2, opacity: 0.8 },
});

export default AddToCartButton;
