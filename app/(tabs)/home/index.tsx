import { View, FlatList, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native'
import axios from 'axios'
import { useEffect, useState } from 'react';
import ItemCard from "../../components/ItemCard";
import MasonryList from '@react-native-seoul/masonry-list';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useGlobalContext } from "@/providers/GlobalContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import Categories from "../../components/Category/categories";
import Subcategories from "../../components/Category/subcategories";

export default function home() {
  const { state, dispatch } = useGlobalContext();
  const [products, setProducts] = useState([]);
  const tabBarHeight = useBottomTabBarHeight();

  const getProducts = async () => {
    try {
      const response = await axios.get("https://fakestoreapi.com/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  const handleAddToCart = (product: any) => {
    dispatch({ type: "ADD_TO_CART", payload: product });
  };

  const handleAddToWishlist = (product: { title: any; }) => {
    dispatch({ type: "ADD_NOTIFICATION", payload: `${product.title} added to wishlist!` });
  };

  return (
    <ScrollView>
      <Categories />
      <Subcategories />
      <MasonryList
        style={{ marginBottom: tabBarHeight }}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: 2,
          elevation: 0,
          backgroundColor: "#F3F3F3F7",
        }}
        numColumns={2}
        data={products}
        renderItem={({ item }: { item: any }) => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              margin: 1,
              padding: 1,
              position: "fixed",
            }}
          >
            <ItemCard item={item} />
            <TouchableOpacity
              onPress={() => handleAddToWishlist(item)}
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                borderRadius: 20,
                padding: 5,
              }}
            >
              <Ionicons name="heart-outline" size={25} color="#A37E2C" />
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 10,
                paddingHorizontal: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#333",
                  marginBottom: 5,
                }}
                numberOfLines={1} // Ensure the product name is displayed in one line
              >
                {item.title}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 10,
                paddingHorizontal: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => handleAddToCart(item)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  borderRadius: 20,
                  padding: 1,
                }}
              >
                <Ionicons name="cart-outline" size={20} color="#A37E2C" />
              </TouchableOpacity>
              <Text
                style={{
                  backgroundColor: "#CBDDC86A",
                  color: "#A37E2C",
                  borderRadius: 4,
                  paddingVertical: 2,
                  paddingHorizontal: 15,
                  fontSize: 25,
                  fontWeight: "bold",
                }}
              >
                {item.price} جـ.س
              </Text>
              
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}


