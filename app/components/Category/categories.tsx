import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// Types
type Category = {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

// Constants
const { width } = Dimensions.get('window');
const CATEGORY_SIZE = width * 0.15; // 15% of screen width
const SPACING = 10;

const categories: Category[] = [
  { id: 1, name: 'Electronics', icon: 'tv-outline' },
  { id: 2, name: 'Clothing', icon: 'shirt-outline' },
  { id: 3, name: 'Home', icon: 'home-outline' },
  { id: 4, name: 'Books', icon: 'book-outline' },
  { id: 5, name: 'Toys', icon: 'game-controller-outline' },
  { id: 6, name: 'Sports', icon: 'barbell-outline' },
  { id: 7, name: 'Beauty', icon: 'sparkles-outline' },
  { id: 8, name: 'Health', icon: 'medkit-outline' },
  { id: 9, name: 'Auto', icon: 'car-outline' },
  { id: 10, name: 'Garden', icon: 'leaf-outline' },
  { id: 11, name: 'Grocery', icon: 'cart-outline' },
];

const Categories = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const handleCategoryPress = (categoryId: number) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CATEGORY_SIZE + SPACING}
        decelerationRate="fast"
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategory === category.id && styles.selectedCategory
            ]}
            onPress={() => handleCategoryPress(category.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${category.name} category`}
          >
            <Ionicons 
              name={category.icon} 
              size={CATEGORY_SIZE * 0.4} 
              color={selectedCategory === category.id ? '#FFFFFF' : '#A37E2C'} 
            />
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.selectedText
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: SPACING,
  },
  categoryItem: {
    width: CATEGORY_SIZE,
    height: CATEGORY_SIZE,
    borderRadius: CATEGORY_SIZE / 2,
    backgroundColor: '#F8F8F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCategory: {
    backgroundColor: '#A37E2C',
    shadowColor: '#A37E2C',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  categoryText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    maxWidth: '90%',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default Categories;