import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import ItemCard from "../../components/ItemCard";
import MasonryList from "@react-native-seoul/masonry-list";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link, RelativePathString } from "expo-router";
import useItemstore from "../../productStore/useItemStore";

export default function home() {
  const products = useQuery(api.products.getProducts.getProducts, {});
  const { setItem  } = useItemstore();

  if (products === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={"#A37E2C"} size="large" />
      </View>
    );
  }

  const data = ["hi", "welcome", "hello", "bass", "done", "ecom"];
  return (
    <>
      <MasonryList
        data={products}
        keyExtractor={(item) => item._id.toString()}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 4, backgroundColor: "#f5f5f5" }}
        renderItem={({ item }: { item: any }) => (
          <View>
            <Link
              href={{
                pathname: `/${item._id}` as RelativePathString,
                params: {
                  name: item.name,
                  price: item.price,
                  image: JSON.stringify(item.images),
                },
              }}
              asChild
            >
              <Pressable onPress={() => setItem(item)}>
                <ItemCard item={item} />
              </Pressable>
            </Link>

            <Ionicons
              name="cart-outline"
              size={16}
              color="black"
              style={styles.cartIcon}
            />
          </View>
        )}
      />
    </>
  );
}
const styles = StyleSheet.create({
  cartIcon: {
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    bottom: 10,
    left: 10,
    borderColor: "#A37E2C",
    borderWidth: 1,
    borderRadius: 40,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
