import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text } from "@/components/ui/text";
import React, { useMemo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useTheme } from "@/providers/ThemeProvider";
import { extractCartItemAttributes, getAttributesDisplayText } from "@/utils/cartUtils";
import i18n from "@/utils/i18n";

import {
  formatMoney,
  getProductFinalMoney,
  getProductOriginalMoney,
  getFinalPrice,
  getOriginalPrice,
  hasDiscount,
  type Money,
} from "@/utils/priceUtils";
import { normalizeProduct } from "@/domain/product/product.normalize";
import { matchVariant } from "@/domain/variant/variant.match";

import { navigateToProduct } from "@/utils/deepLinks";
import type { CartItem as CartLineItem } from "@/types/cart.types";

interface CartItemProps {
  item: CartLineItem;
  increment: (item: CartLineItem) => void;
  decrement: (item: CartLineItem) => void;
  deleteItem: (item: CartLineItem) => void;
  isUpdating: boolean;
  imageSize?: number;
}

const HAIRLINE = StyleSheet.hairlineWidth;

const CartItem = React.memo(function CartItem({
  item,
  increment,
  decrement,
  deleteItem,
  isUpdating,
  imageSize = 100,
}: CartItemProps) {
  const { theme } = useTheme();
  const Colors = theme.colors;

  const imageUri: string | null = (item?.product as any)?.images?.[0] || null;

  const attributes = useMemo(() => extractCartItemAttributes(item), [item]);
  const attributesText = useMemo(
    () => getAttributesDisplayText(attributes),
    [attributes]
  );

  const normalizedProduct = useMemo(() => {
    const raw = item?.product;
    return raw ? normalizeProduct(raw) : null;
  }, [item?.product]);

  const validQty =
    typeof item?.quantity === "number" && !isNaN(item.quantity)
      ? item.quantity
      : 0;

  const matchingVariant = useMemo(() => {
    if (!normalizedProduct) return null;
    return matchVariant(normalizedProduct, attributes);
  }, [normalizedProduct, attributes]);

  const finalUnitMoney = useMemo(
    () => getProductFinalMoney(normalizedProduct, matchingVariant),
    [normalizedProduct, matchingVariant]
  );
  const originalUnitMoney = useMemo(
    () => getProductOriginalMoney(normalizedProduct, matchingVariant),
    [normalizedProduct, matchingVariant]
  );

  const finalUnit = useMemo(() => {
    if (finalUnitMoney) return finalUnitMoney.amount;
    if (!normalizedProduct) return 0;
    return getFinalPrice(normalizedProduct, { variant: matchingVariant });
  }, [finalUnitMoney, normalizedProduct, matchingVariant]);

  const originalUnit = useMemo(() => {
    if (originalUnitMoney) return originalUnitMoney.amount;
    if (!normalizedProduct) return 0;
    return getOriginalPrice(normalizedProduct, { variant: matchingVariant });
  }, [originalUnitMoney, normalizedProduct, matchingVariant]);

  const hasDisc = useMemo(() => {
    if (finalUnitMoney && originalUnitMoney) {
      return originalUnitMoney.amount > finalUnitMoney.amount;
    }
    return hasDiscount(normalizedProduct, { variant: matchingVariant });
  }, [finalUnitMoney, originalUnitMoney, normalizedProduct, matchingVariant]);

  const totalFinal = finalUnit * validQty;
  const totalOriginal = originalUnit * validQty;

  const buildLineMoney = (amount: number, src: Money | null): Money | number =>
    src ? { amount, currency: src.currency, decimals: src.decimals } : amount;

  const finalTotalLabel = useMemo(
    () => formatMoney(buildLineMoney(totalFinal, finalUnitMoney)),
    [totalFinal, finalUnitMoney]
  );
  const originalTotalLabel = useMemo(
    () => formatMoney(buildLineMoney(totalOriginal, originalUnitMoney)),
    [totalOriginal, originalUnitMoney]
  );

  const goToProduct = () => {
    if (item?.product?._id) {
      navigateToProduct(item.product._id, item.product);
    }
  };

  const productName = item?.product?.name || "Product";
  const productLinkLabel = `${productName}${attributesText ? `, ${attributesText}` : ""}`;

  return (
    <View style={[styles.container, isUpdating && styles.containerUpdating]}>
      <TouchableOpacity
        onPress={goToProduct}
        activeOpacity={0.7}
        accessibilityRole="imagebutton"
        accessibilityLabel={productLinkLabel}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[
              styles.productImage,
              { width: imageSize, height: imageSize },
            ]}
            contentFit="cover"
            accessibilityLabel={productName}
          />
        ) : (
          <View
            style={[
              styles.productImage,
              styles.imagePlaceholder,
              {
                width: imageSize,
                height: imageSize,
                backgroundColor: Colors.cardBackground,
              },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={Math.round(imageSize * 0.35)}
              color={Colors.text.veryLightGray}
            />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.details}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.nameWrap}
            onPress={goToProduct}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.productName, { color: Colors.text.gray }]}
              numberOfLines={2}
            >
              {item?.product?.name || "Product"}
            </Text>

            {attributesText ? (
              <Text
                style={[
                  styles.productAttrs,
                  { color: Colors.text.veryLightGray },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {attributesText}
              </Text>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => deleteItem(item)}
            disabled={isUpdating}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("cart_removeItem") || "Remove item"}
            accessibilityState={{ disabled: isUpdating, busy: isUpdating }}
            hitSlop={10}
            style={styles.removeBtn}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color={Colors.text.veryLightGray} />
            ) : (
              <Ionicons
                name="close"
                size={18}
                color={Colors.text.veryLightGray}
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.stepper,
              { borderColor: Colors.text.veryLightGray },
            ]}
            accessibilityRole="adjustable"
            accessibilityLabel={i18n.t("cart_quantity") || "Quantity"}
            accessibilityValue={{ text: String(validQty) }}
          >
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => decrement(item)}
              disabled={isUpdating}
              accessibilityRole="button"
              accessibilityLabel={
                i18n.t("cart_decreaseQuantity") || "Decrease quantity"
              }
              accessibilityState={{ disabled: isUpdating }}
              hitSlop={8}
            >
              <Ionicons name="remove" size={16} color={Colors.text.gray} />
            </TouchableOpacity>

            <Text style={[styles.qtyText, { color: Colors.text.gray }]}>
              {validQty}
            </Text>

            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => increment(item)}
              disabled={isUpdating}
              accessibilityRole="button"
              accessibilityLabel={
                i18n.t("cart_increaseQuantity") || "Increase quantity"
              }
              accessibilityState={{ disabled: isUpdating }}
              hitSlop={8}
            >
              <Ionicons name="add" size={16} color={Colors.text.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.priceWrap}>
            {hasDisc ? (
              <Text
                style={[
                  styles.originalPrice,
                  { color: Colors.text.veryLightGray },
                ]}
                numberOfLines={1}
              >
                {originalTotalLabel}
              </Text>
            ) : null}
            <Text
              style={[styles.price, { color: Colors.text.gray }]}
              numberOfLines={1}
            >
              {finalTotalLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

export default CartItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  containerUpdating: {
    opacity: 0.55,
  },
  productImage: {
    borderRadius: 6,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
    justifyContent: "space-between",
    minHeight: 80,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  nameWrap: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 19,
  },
  productAttrs: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "400",
  },
  removeBtn: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: HAIRLINE,
    borderRadius: 6,
    paddingHorizontal: 2,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "500",
    minWidth: 18,
    textAlign: "center",
  },
  priceWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexShrink: 1,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
    fontWeight: "400",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 0,
  },
});
