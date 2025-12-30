import { View, StyleSheet, TouchableOpacity, ActivityIndicator, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";

 const CartItem = React.memo(function CartItem({
  item,
  increment,
  decrement,
  deleteItem,
  isUpdating,
}: any) {
  const PLACEHOLDER_IMAGE =
    "https://placehold.co/80x100/eeeeee/aaaaaa?text=No+Image";

  const imageSource = item?.product?.images?.[0] || PLACEHOLDER_IMAGE;
  return (
    <View style={styles.container}>
      <View style={styles.imgContainer}>
        <Image
          source={imageSource}
          style={styles.productImage}
          contentFit="cover"
        />
      </View>
      <View style={styles.details}>
        <View style={styles.nameAndSize}>
          <Text style={styles.productName}>
            {item?.product?.name || "Product Name"}
          </Text>
          <Text style={styles.productSize}>المقاس : {item?.size || "N/A"}</Text>
        </View>
        <View style={styles.priceAndQuantity}>
          <View style={styles.quantity}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                decrement(item);
              }}
            >
              <Ionicons name="remove" size={18} color="#666" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{item?.quantity || 0}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => {
                increment(item);
              }}
            >
              <Ionicons name="add" size={18} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.price}>
            {(item?.product?.price * item?.quantity || 0).toFixed(2)}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.trashContainer}
        onPress={() => {
          deleteItem(item);
        }}
        disabled={isUpdating}
      >
        {
          isUpdating ? (
            <ActivityIndicator size="small" color="#ff4444" />
          ) :(
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          )
        }
      </TouchableOpacity>
    </View>
  );
});

export default CartItem;  

const styles = StyleSheet.create({
  container: {
    backgroundColor:"#fff",
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
    color: "#333",
    marginBottom: 4,
  },

  productSize: {
    fontSize: 12,
    color: "#666",
  },

  priceAndQuantity: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantity: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8E8E8FF",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 2,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 12,
    color: "#333",
  },
  price: {
    marginLeft: 22,
    fontSize: 14,
    fontWeight: "700",
    color: "#2c5530",
  },
  trashContainer: {
    justifyContent: "center",
    alignItems: "center",
    width: 28,
    height: 28,
    borderRadius: 20,
    backgroundColor: "#F4DDDDFF",
    marginLeft: 12,
  },
});
