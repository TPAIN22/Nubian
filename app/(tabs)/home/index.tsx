import { View, FlatList } from 'react-native'
import axios from 'axios'
import { useEffect, useState } from 'react';
import ItemCard from "../../components/ItemCard";
import  MasonryList from '@react-native-seoul/masonry-list';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

export default function home() {
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

  return (
      <MasonryList
         style={{ marginBottom: tabBarHeight }}
         keyExtractor={(item) => item.id.toString()
         }
         contentContainerStyle={{
           padding: 2,
           elevation: 0,
           backgroundColor: "#F3F3F3F7",
         }}
         numColumns={2}
         data={products}
        renderItem={({ item }: { item: any }) => (
        <View style={{
          backgroundColor: "white",
          borderRadius: 8,
          margin: 2,
        }}
      >
          <ItemCard item={item} />
          </View>
        )}
        />
  );
}
