import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

const SearchPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  // جلب جميع المنتجات من قاعدة البيانات
  const products = useQuery(api.products.getProducts.getProducts, {});

  // تصفية النتائج حسب النص المكتوب
  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* حقل البحث */}
      <TextInput
        placeholder="ابحث عن منتج..."
        style={styles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
      />

      {/* نتائج البحث */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={<Text style={styles.noResults}>لا توجد نتائج</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push(`/${item._id}`)}
          >
            <Image source={{ uri: item.images?.[0] }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price} SDG</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default SearchPage;

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  input: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomColor: "#ddd",
    borderBottomWidth: 1,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  price: {
    color: "#555",
    marginTop: 4,
  },
  noResults: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
    color: "#999",
  },
});
