import { View, TextInput, StyleSheet } from "react-native";
import React, { useState } from "react";
import { Tabs } from "expo-router";
import { Image } from "expo-image";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function _layout() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarHideOnKeyboard: true, 
        headerTitle: () => (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.icon} />
            <TextInput
              placeholder="ابحث..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
        ),
        headerRight: () => (
          <Ionicons 
          name="cart-outline" size={24} color="#A37E2C" />
           
          
        ),
        headerLeft: () => (
          <Image
            source={require("../../../assets/images/icon.png")}
            style={{ width: 50, height: 50, top: 3 }}
          />
        ),
      }}
    />
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
    minWidth: "100%",
  },
  icon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
});
