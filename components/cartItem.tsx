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

  // ✅ Extract attributes safely (handles Map/object/legacy size)
  const attributes = useMemo(() => extractCartItemAttributes(item), [item]);
  const attributesText = useMemo(
    () => getAttributesDisplayText(attributes),
    [attributes]
  );

  const normalizedProduct = useMemo(() => {
    const raw = item?.product;
    return raw ? normalizeProduct(raw) : null;
  }, [item?.product]);

  // ✅ IMPORTANT: price must be calculated using selectedAttributes => variant price
  const validQty =
    typeof item?.quantity === "number" && !isNaN(item.quantity)
      ? item.quantity
      : 0;

  const matchingVariant = useMemo(() => {
    if (!normalizedProduct) return null;
    return matchVariant(normalizedProduct, attributes);
  }, [normalizedProduct, attributes]);

  // Prefer typed Money envelope; fall back to legacy resolver for older payloads.
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

  return (
    <View style={[styles.container, { backgroundColor: Colors.cardBackground }]}>
      <TouchableOpacity
        style={styles.imgContainer}
        onPress={() => {
          if (item?.product?._id) {
            navigateToProduct(item.product._id, item.product);
          }
        }}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.productImage, { width: imageSize, height: imageSize }]}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.productImage,
              styles.imagePlaceholder,
              {
                width: imageSize,
                height: imageSize,
                backgroundColor: Colors.surface,
              },
            ]}
          >
            <Ionicons name="image-outline" size={Math.round(imageSize * 0.4)} color={Colors.text.veryLightGray} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.details}>
        <TouchableOpacity
          style={styles.nameAndSize}
          onPress={() => {
            if (item?.product?._id) {
              navigateToProduct(item.product._id, item.product);
            }
          }}
        >
          <Text
            style={[styles.productName, { color: Colors.text.gray }]}
            numberOfLines={2}
          >
            {item?.product?.name || "Product Name"}
          </Text>

          {attributesText ? (
            <Text
              style={[styles.productSize, { color: Colors.text.veryLightGray }]}
            >
              {attributesText}
            </Text>
          ) : null}
        </TouchableOpacity>

        <View style={styles.priceAndQuantity}>
          <View style={[styles.quantity, { backgroundColor: Colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                { backgroundColor: Colors.cardBackground },
              ]}
              onPress={() => decrement(item)}
              disabled={isUpdating}
              accessibilityRole="button"
              accessibilityLabel={i18n.t("cart_decreaseQuantity") || "Decrease quantity"}
              accessibilityState={{ disabled: isUpdating }}
            >
              <Ionicons name="remove" size={18} color={Colors.text.gray} />
            </TouchableOpacity>

            <Text style={[styles.quantityText, { color: Colors.text.gray }]}>
              {validQty}
            </Text>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                { backgroundColor: Colors.cardBackground },
              ]}
              onPress={() => increment(item)}
              disabled={isUpdating}
              accessibilityRole="button"
              accessibilityLabel={i18n.t("cart_increaseQuantity") || "Increase quantity"}
              accessibilityState={{ disabled: isUpdating }}
            >
              <Ionicons name="add" size={18} color={Colors.text.gray} />
            </TouchableOpacity>
          </View>

          <View style={styles.priceContainer}>
            {hasDisc && (
              <Text
                style={[
                  styles.originalPriceText,
                  { color: Colors.text.veryLightGray },
                ]}
              >
                {originalTotalLabel}
              </Text>
            )}
            <Text
              style={[styles.price, { color: Colors.success }]}
              numberOfLines={1}
            >
              {finalTotalLabel}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.trashContainer, { backgroundColor: Colors.error + "20" }]}
        onPress={() => deleteItem(item)}
        disabled={isUpdating}
        accessibilityRole="button"
        accessibilityLabel={i18n.t("cart_removeItem") || "Remove item"}
        accessibilityState={{ disabled: isUpdating, busy: isUpdating }}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color={Colors.error} />
        ) : (
          <Ionicons name="trash-outline" size={20} color={Colors.error} />
        )}
      </TouchableOpacity>
    </View>
  );
});

export default CartItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 5,
  },
  imgContainer: {
    marginRight: 16,
  },
  productImage: {
    borderRadius: 8,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  details: {
    flex: 1,
    justifyContent: "space-between",
  },
  nameAndSize: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  productSize: {
    fontSize: 12,
  },
  priceAndQuantity: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  quantity: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    margin: 2,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 22,
    flexShrink: 0,
    minWidth: 80,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 0,
  },
  originalPriceText: {
    fontSize: 12,
    textDecorationLine: "line-through",
    fontWeight: "400",
  },
  trashContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 28,
    height: 28,
    borderRadius: 20,
    marginLeft: 12,
  },
});
