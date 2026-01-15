import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Text } from "@/components/ui/text";
import React, { useMemo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useTheme } from "@/providers/ThemeProvider";
import { extractCartItemAttributes, getAttributesDisplayText } from "@/utils/cartUtils";

import {
  formatPrice as formatPriceUtil,
  getFinalPrice,
  getOriginalPrice,
  hasDiscount
} from "@/utils/priceUtils";
import { normalizeProduct } from "@/domain/product/product.normalize";
import { matchVariant } from "@/domain/variant/variant.match";

import { navigateToProduct } from "@/utils/deepLinks";

const CartItem = React.memo(function CartItem({
  item,
  increment,
  decrement,
  deleteItem,
  isUpdating,
}: any) {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { width: screenWidth } = useWindowDimensions();
  
  const PLACEHOLDER_IMAGE =
    "https://placehold.co/80x100/eeeeee/aaaaaa?text=No+Image";

  const imageUri = item?.product?.images?.[0] || PLACEHOLDER_IMAGE;

  // Responsive image size
  const imageSize = screenWidth < 360 ? 80 : screenWidth < 600 ? 100 : 120;

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

  const finalUnit = useMemo(() => {
    if (!normalizedProduct) return 0;
    return getFinalPrice(normalizedProduct, { variant: matchingVariant });
  }, [normalizedProduct, matchingVariant]);

  const originalUnit = useMemo(() => {
    if (!normalizedProduct) return 0;
    return getOriginalPrice(normalizedProduct, { variant: matchingVariant });
  }, [normalizedProduct, matchingVariant]);

  const hasDisc = useMemo(() => hasDiscount(normalizedProduct, { variant: matchingVariant }), [normalizedProduct, matchingVariant]);

  const totalFinal = finalUnit * validQty;
  const totalOriginal = originalUnit * validQty;

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
        <Image
          source={{ uri: imageUri }}
          style={[styles.productImage, { width: imageSize, height: imageSize }]}
          contentFit="cover"
        />
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
                {formatPriceUtil(totalOriginal)}
              </Text>
            )}
            <Text
              style={[styles.price, { color: Colors.success }]}
              numberOfLines={1}
            >
              {formatPriceUtil(totalFinal)}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.trashContainer, { backgroundColor: Colors.error + "20" }]}
        onPress={() => deleteItem(item)}
        disabled={isUpdating}
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
