import React from 'react';
import { Category } from '../../types/category';
import { TouchableOpacity, View, Text } from 'react-native';

interface CategoryListProps {
  categories: Category[];
  onSelect: (categorySlug: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, onSelect }) => {
  return (
    <View style={styles.categoryList}>
      {categories.map((category) => (
        <View key={category.id} style={styles.categoryItem}>
          <TouchableOpacity
            onPress={() => onSelect(category.slug)}
            style={styles.categoryButton}
          >
            <Text>{category.name}</Text>
          </TouchableOpacity>

          {category.subcategories && (
            <View style={styles.subcategoryList}>
              {category.subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => onSelect(sub.slug)}
                  style={styles.subcategoryButton}
                >
                  <Text>{sub.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  categoryList: {
    // Add your styles here
    padding: 10,
  },
  categoryItem: {
    // Add your styles here
    marginBottom: 10,
  },
  categoryButton: {
    // Add your styles here
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
  },
  subcategoryList: {
    // Add your styles here
    marginLeft: 20,
  },
  subcategoryButton: {
    // Add your styles here
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 5,
  },
});

export default CategoryList;
// Note: The CSS classes used in this component should be defined in your CSS file to style the category list and buttons appropriately.