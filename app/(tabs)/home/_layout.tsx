import { View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Link } from "expo-router";
import MasonryList from '@react-native-seoul/masonry-list';

export default function _layout() {
  const [products, setProducts] = useState([]);

  const getProducts = async () => {
    try {
      const response = await axios.get("https://fakestoreapi.com/products");
      const randomized = response.data.map((item: any) => ({
        ...item,
        height: 250 + Math.floor(Math.random() * 80),
      }));
      setProducts(randomized);
    } catch (error) {}
  };

  useEffect(() => {
    getProducts();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 6, marginBottom: 70 }}>
        <StatusBar style="dark" />

        <MasonryList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }: any) => (
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                margin: 6,
                padding: 8,
                minHeight: item.height,
                
                justifyContent: "space-between",
              }}
            >
              <Image
                source={{ uri: item.image }}
                style={{ width: "100%", height: 150 }}
                contentFit="contain"
              />
              <View className="space-y-4 p-4">
                    
              <Text numberOfLines={1} style={{ fontWeight: "bold" }}>
                {item.title}
              </Text>
              <View className="flex-row w-full items-center justify-end">
                <Text className="mr-2 text-red-500 line-through bg-yellow-200 px-1">
                $sd {Math.round(item.price + item.price * 0.34)}
                </Text>
              </View>
              <View className="flex-row w-full items-center justify-end">
                <Text className="mr-2 text-[#006348] bg-[#D5F5E3] px-3 mt-2 mb-2"> $sd {item.price}</Text>
              </View>
              <View className="flex-row w-full items-center justify-between">
              <Image source={require("../../../assets/images/cart-shopping-solid.svg") } style={{width: 20, height: 20 , tintColor: '#4E4617'}}></Image>
              <Text style={{ color: "#4E4617", textAlign: "right" }}>
                {item.category}
              </Text>
              </View>
              </View>
            </View>
          )}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
