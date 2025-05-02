import { Stack } from 'expo-router';

import React from 'react';
import { Tabs } from 'expo-router';
import { Image } from 'expo-image';
const iconSize = 24;
const focusedColor = '#4d4617';
const unfocusedColor = '#A37E2C';
const backgroundColorFocused = 'rgba(163, 126, 44, 0.2)'; // primary/20
import  Ionicons  from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import axios from 'axios';

export default function TabLayout() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <Tabs
      screenOptions={{
        header: () => <CustomHeader />,
        headerShown: true,
        tabBarActiveTintColor: focusedColor,
        tabBarInactiveTintColor: unfocusedColor,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: -4,
        },
        tabBarItemStyle: {
          borderRadius: 12,
          margin: 6,
          height: 48,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
    </Tabs>
  );
}


const CustomHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: number; title: string }[]>([]);
  const router = useRouter();
  const [notificationCount] = useState(0);

  const handleSearchChange = async (query: React.SetStateAction<string>) => {
    setSearchQuery(query);
    if (query.length > 0) {
      try {
        const response = await axios.get(`https://fakestoreapi.com/products`);
        const filteredSuggestions = response.data.filter((product: { title: string; }) =>
          product.title.toLowerCase().includes((query as string).toLowerCase())
        );
        setSuggestions(filteredSuggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (product: { id: number; title: string }) => {
    setSearchQuery(product.title);
    setSuggestions([]);
    router.push(`/explor?search=${product.title}`);
  };

  return (
    <SafeAreaView style={styles.headerContainer}>
      <View style={styles.headerContent}>
        {/* Logo */}
        <ExpoImage 
          source={require('nubian/assets/images/icon.png')}
          contentPosition="top"
          style={styles.logo}
          contentFit="contain"
        />
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={handleSearchChange}
            clearButtonMode="while-editing"
          />
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => handleSuggestionClick(product)}
                style={styles.suggestionItem}
              >
                <Text>{product.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Notification Icon */}
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#4d4617" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 25,
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: -10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 5,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 20,
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    marginLeft: -10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ff4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
});