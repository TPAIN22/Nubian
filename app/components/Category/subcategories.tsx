import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Subcategories = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Subcategories Component</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});

export default Subcategories;