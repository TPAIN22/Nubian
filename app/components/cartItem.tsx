import { View, StyleSheet, TouchableOpacity, ActivityIndicator, I18nManager, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useTheme } from "@/providers/ThemeProvider";
import { extractCartItemAttributes, getAttributesDisplayText } from "@/utils/cartUtils";
import { getFinalPrice, getOriginalPrice, hasDiscount, formatPrice as formatPriceUtil } from "@/utils/priceUtils";
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

  const imageSource = item?.product?.images?.[0] || PLACEHOLDER_IMAGE;
  
  // Responsive image size based on screen width
  const imageSize = screenWidth < 360 ? 80 : screenWidth < 600 ? 100 : 120;
  
  // Extract attributes from cart item (handles both new and legacy formats)
  const attributes = extractCartItemAttributes(item);
  const attributesText = getAttributesDisplayText(attributes);
  
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
          source={imageSource}
          style={[styles.productImage, { width: imageSize, aspectRatio: 1 }]}
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
          <Text style={[styles.productName, { color: Colors.text.gray }]} numberOfLines={2}>
            {item?.product?.name || "Product Name"}
          </Text>
          {attributesText ? (
            <Text style={[styles.productSize, { color: Colors.text.veryLightGray }]}>
              {attributesText}
            </Text>
          ) : (
            item?.size && (
              <Text style={[styles.productSize, { color: Colors.text.veryLightGray }]}>
                المقاس : {item.size}
              </Text>
            )
          )}
        </TouchableOpacity>
        <View style={styles.priceAndQuantity}>
          <View style={[styles.quantity, { backgroundColor: Colors.surface }]}>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: Colors.cardBackground }]}
              onPress={() => {
                decrement(item);
              }}
            >
              <Ionicons name="remove" size={18} color={Colors.text.gray} />
            </TouchableOpacity>
            <Text style={[styles.quantityText, { color: Colors.text.gray }]}>{item?.quantity || 0}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, { backgroundColor: Colors.cardBackground }]}
              onPress={() => {
                increment(item);
              }}
            >
              <Ionicons name="add" size={18} color={Colors.text.gray} />
            </TouchableOpacity>
          </View>
          <View style={styles.priceContainer}>
            {(() => {
              // price = original price, discountPrice = final selling price
              const finalPrice = getFinalPrice(item?.product);
              const originalPrice = getOriginalPrice(item?.product);
              const hasDiscountPrice = hasDiscount(item?.product);
              const validQuantity = typeof item?.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
              const totalFinalPrice = finalPrice * validQuantity;
              const totalOriginalPrice = originalPrice * validQuantity;
              
              return (
                <>
                  {hasDiscountPrice && (
                    <Text style={[styles.originalPriceText, { color: Colors.text.veryLightGray }]}>
                      {formatPriceUtil(totalOriginalPrice)}
                    </Text>
                  )}
                  <Text style={[styles.price, { color: Colors.success }]} numberOfLines={1}>
                    {formatPriceUtil(totalFinalPrice)}
                  </Text>
                </>
              );
            })()}
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.trashContainer, { backgroundColor: Colors.error + '20' }]}
        onPress={() => {
          deleteItem(item);
        }}
        disabled={isUpdating}
      >
        {
          isUpdating ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) :(
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
          )
        }
      </TouchableOpacity>
    </View>
  );
});

export default CartItem;  

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 12,
    padding:5
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
    flexWrap: "wrap", // Allow wrapping on very small screens
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 22,
    flexShrink: 0, // Never shrink price container
    minWidth: 80, // Ensure price is always visible
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 0, // Never shrink price text
  },
  originalPriceText: {
    fontSize: 12,
    textDecorationLine: 'line-through',
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
