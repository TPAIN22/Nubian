import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { Image } from 'expo-image';

export default function ItemCard({ item }: { item: { image: string, title: string, price: number } }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={styles.productImage}
      />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.price}>{item.price} جـ.س</Text>
        <View style={styles.cartButton}>
          <Image
            source={require('../../assets/images/cart-shopping-solid.svg')}
            style={styles.cartIcon}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 180,
    objectFit: 'contain', // ملاحظة تحت
    borderRadius: 8,
  },
  details: {
    padding: 10,
  },
  title: {
    textAlign: 'right',
  },
  price: {
    textAlign: 'right',
    backgroundColor: '#CBDDC86A',
    width: '60%',
    color: '#A37E2C',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartButton: {
    padding: 5,
    borderWidth: 1,
    minWidth: 40,
    alignItems: 'center',
    borderRadius: 15,
    marginTop: 8,
    position : 'absolute',
    left: 10,
    bottom: 5
  },
  cartIcon: {
    
    tintColor: 'black',
    width: 15,
    height: 15,
    objectFit: 'contain', // ملاحظة تحت
  },
});
