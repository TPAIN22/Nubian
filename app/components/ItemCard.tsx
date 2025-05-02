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
      {/* <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.price}>{item.price} جـ.س</Text>
      </View> */}
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
    height: 280,
    objectFit: 'contain', // ملاحظة تحت
    borderRadius: 8,
  },
  details: {
    padding: 5,
  },
  title: {
    textAlign: 'right',
  },
});
