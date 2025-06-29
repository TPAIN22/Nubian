import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (categoryId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expanded === categoryId) {
      setExpanded(null); // Collapse if already expanded
    } else {
      setExpanded(categoryId); // Expand new one
    }
  };

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      onSelectCategory(null); // Deselect if already selected
    } else {
      onSelectCategory(categoryId);
    }
  };

  const renderItem = (item: Category, level = 0) => {
    const isExpanded = expanded === item._id;
    const isSelected = selectedCategory === item._id;

    return (
      <View key={item._id} style={{ marginLeft: level * 12 }}>
        <TouchableOpacity
          style={[styles.row, isSelected && styles.selectedRow]}
          onPress={() => handleSelectCategory(item._id)}
          onLongPress={() => item.children && item.children.length > 0 && toggleExpand(item._id)}
        >
          <Text style={[styles.title, isSelected && styles.selectedTitle]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.children && item.children.length > 0 && (
            <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-back'} size={18} color="#e98c22" />
          )}
        </TouchableOpacity>
        {isExpanded && item.children && item.children.length > 0 && (
          <View style={styles.childContainer}>
            {item.children.map(child => renderItem(child, level + 1))}
          </View>
        )}
      </View>
    );
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
    backgroundColor: '#e98c22',
    borderColor: '#e98c22',
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
    color: '#e98c22',
    fontWeight: '600',
  },
  childContainer: {
    backgroundColor: '#fafafa',
  },
});

export default CategoryAccordion; 