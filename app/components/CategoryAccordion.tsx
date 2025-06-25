import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
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
      <View key={item._id} style={{ marginLeft: level * 20 }}>
        <TouchableOpacity
          style={[styles.row, isSelected && styles.selectedRow]}
          onPress={() => handleSelectCategory(item._id)}
          onLongPress={() => item.children && item.children.length > 0 && toggleExpand(item._id)}
        >
          <Text style={styles.title}>{item.name}</Text>
          {item.children && item.children.length > 0 && (
            <Ionicons name={isExpanded ? 'chevron-down' : 'chevron-back'} size={24} color="#e98c22" />
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
      {categories.map(category => renderItem(category))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedRow: {
    backgroundColor: '#fdf3e8',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  childContainer: {
    backgroundColor: '#fafafa',
  },
});

export default CategoryAccordion; 