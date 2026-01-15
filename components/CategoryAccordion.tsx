import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/ui/text';


interface Category {
  _id: string;
  name: string;
  children?: Category[];
}

interface CategoryAccordionProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
}

const CategoryAccordion: React.FC<CategoryAccordionProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  const handleSelectCategory = (categoryId: string) => {
    onSelectCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.selectedChip]}
          onPress={() => onSelectCategory(null)}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.selectedChipText]}>
            الكل
          </Text>
        </TouchableOpacity>
        
        {categories.map(category => (
          <TouchableOpacity
            key={category._id}
            style={[styles.categoryChip, selectedCategory === category._id && styles.selectedChip]}
            onPress={() => handleSelectCategory(category._id)}
          >
            <Text style={[styles.chipText, selectedCategory === category._id && styles.selectedChipText]}>
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
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedChip: {
    backgroundColor: '#f0b745',
    borderColor: '#f0b745',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  selectedChipText: {
    color: '#fff',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedRow: {
    backgroundColor: '#fdf3e8',
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  selectedTitle: {
    color: '#f0b745',
    fontWeight: '600',
  },
  childContainer: {
    backgroundColor: '#fafafa',
  },
});

export default CategoryAccordion; 