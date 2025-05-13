import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

const SearchPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="ابحث عن منتج..."
        style={styles.input}
        value={searchTerm}
        onChangeText={setSearchTerm}
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
