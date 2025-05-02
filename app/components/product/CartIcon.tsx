import React from 'react';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const CartIcon = () => {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name="cart" size={20} color="#fff" />
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    backgroundColor: '#A37E2C',
    borderRadius: 20,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CartIcon;