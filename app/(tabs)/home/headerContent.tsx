import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeHeaderContentProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  borderColor: string;
}

export default function HomeHeaderContent({
  searchQuery,
  setSearchQuery,
  borderColor,
}: HomeHeaderContentProps) {
  return (
    <View style={[styles.searchContainer, { borderColor: borderColor }]}>
      <Ionicons
        name="search"
        size={20}
        color="#718096"
        style={styles.searchIcon}
      />
      <TextInput
        placeholder="ابحث عن المنتجات..."
        placeholderTextColor="#A0AEC0"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
        returnKeyType="search"
      />
      {searchQuery.length > 0 && (
        <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
          <Ionicons name="close-circle" size={20} color="#CBD5E0" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 10,
    height: 40,
  
    minWidth: "96%",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: "right",
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: "#2D3748",
  },
  clearSearchButton: {
    marginLeft: 2,
  },
});