import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import ItemCard from "../../components/ItemCard";
import ItemCardSkeleton from "../../components/ItemCardSkeleton"; // أضف هذا
import MasonryList from "@react-native-seoul/masonry-list";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link, RelativePathString, Stack } from "expo-router";
import useItemstore from "../../productStore/useItemStore";
import { useHeaderHeight } from "@react-navigation/elements";
  export default function Home() {
  const headerHieght = useHeaderHeight();
  const products = useQuery(api.products.getProducts.getProducts, {});
  const { setItem } = useItemstore();

  const isLoading = products === undefined;

  const skeletonItems = Array.from({ length: 12 }).map((_, index) => ({
    _id: `skeleton-${index}`,
    skeleton: true,
  }));

  return (
    <>
    <Stack.Screen options={{ headerTransparent: true}} />

    <MasonryList
      data={isLoading ? skeletonItems : products}
      keyExtractor={(item: any) => item._id.toString()}
      numColumns={2}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 4, backgroundColor: "#f5f5f5" , marginTop: headerHieght }}
      renderItem={({ item }: { item: any }) => {
        if (item.skeleton) return <ItemCardSkeleton />;
        return (
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
        );
      }}
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
});
