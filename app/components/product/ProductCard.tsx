import { TouchableOpacity, View, Image, Text, TouchableWithoutFeedback } from 'react-native';
import { Product } from '../../types/Product'; // Adjust the path as needed
import CartIcon from './CartIcon';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  function formatPrice(price: any, currency: any): import("react").ReactNode {
    throw new Error('Function not implemented.');
  }

  return (
    <TouchableWithoutFeedback
      onPressIn={() => setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
    >
      <View style={styles.card}>
      <Image
        source={{ uri: product.images[0] }}
        alt={product.name}
        style={styles.image}
      />
      <View style={styles.content}>
        <Text>{product.name}</Text>
        <Text style={styles.price}>
          {formatPrice(product.price, product.currency)}
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => onAddToCart(product)}
          accessibilityLabel={`Add ${product.name} to cart`}
        >
          <CartIcon /> Add to Cart
        </TouchableOpacity>
        {isHovered && <Text>Quick View: {product.id}</Text>}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

import { StyleSheet } from 'react-native';
import React, { useState } from 'react';

const styles = StyleSheet.create({
  card: {
    padding: 10,
    margin: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 5,
  },
  content: {
    marginTop: 10,
  },
  price: {
    fontWeight: 'bold',
    marginVertical: 5,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
});

export default ProductCard;