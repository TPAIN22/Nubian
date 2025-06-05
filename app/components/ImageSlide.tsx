import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Swiper from 'react-native-swiper';

const { width } = Dimensions.get('window');

const images = [
  require('../../assets/images/anime.jpeg'),
  require('../../assets/images/human.jpeg'),
  require('../../assets/images/download.jpeg'),
];

export default function ImageSlider() {
  return (
    <View style={{ height: 200, overflow: 'hidden'}}>
      <Swiper autoplay={true} showsPagination={true} loop={true}  activeDotColor='#e98c22'>
        {images.map((uri, index) => (
          <Image key={index} source={uri} style={styles.image} />
        ))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 200,
    objectFit: 'cover',
  },
});
