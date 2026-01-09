import { View, StyleSheet, TouchableOpacity, ActivityIndicator, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useTheme } from "@/providers/ThemeProvider";
import { extractCartItemAttributes, getAttributesDisplayText } from "@/utils/cartUtils";

 const CartItem = React.memo(function CartItem({
  item,
  increment,
  decrement,
  deleteItem,
  isUpdating,
}: any) {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const PLACEHOLDER_IMAGE =
    "https://placehold.co/80x100/eeeeee/aaaaaa?text=No+Image";

  const imageSource = item?.product?.images?.[0] || PLACEHOLDER_IMAGE;
  
  // Extract attributes from cart item (handles both new and legacy formats)
  const attributes = extractCartItemAttributes(item);
  const attributesText = getAttributesDisplayText(attributes);
  
  return (
    <View style={[styles.container, { backgroundColor: Colors.cardBackground }]}>
      <View style={styles.imgContainer}>
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit="cover"
        />
      </View>
      <View style={styles.details}>
        <View style={styles.nameAndSize}>
          <Text style={[styles.productName, { color: Colors.text.gray }]}>
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
        </View>
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
          <Text style={[styles.price, { color: Colors.success }]}>
            {(() => {
              // price = original price, discountPrice = final selling price
              // Use final price (discountPrice if exists and > 0, else price)
              const originalPrice = typeof item?.product?.price === 'number' && !isNaN(item.product.price) && isFinite(item.product.price) ? item.product.price : 0;
              const finalPrice = typeof item?.product?.discountPrice === 'number' && !isNaN(item.product.discountPrice) && isFinite(item.product.discountPrice) && item.product.discountPrice > 0
                ? item.product.discountPrice
                : originalPrice;
              const validQuantity = typeof item?.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
              return (finalPrice * validQuantity).toFixed(2);
            })()}
          </Text>
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
    width: 100,
    height: 120,
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
  price: {
    marginLeft: 22,
    fontSize: 14,
    fontWeight: "700",
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
