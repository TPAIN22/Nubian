import React from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';
import Swiper from 'react-native-swiper';

const { width } = Dimensions.get('window');

export interface Banner {
  _id: string;
  image: string;
  title?: string;
  description?: string;
}

interface ImageSliderProps {
  banners: Banner[];
}

function ImageSlider({ banners }: ImageSliderProps) {
  return (
    <View style={{ height: 200, overflow: 'hidden'}}>
      <Swiper autoplay={true} showsPagination={true} loop={true} activeDotColor='#fff'>
        {banners.map((banner) => (
          <View key={banner._id} style={{ flex: 1 }}>
            <Image source={{ uri: banner.image }} style={styles.image} />
            {(banner.title || banner.description) && (
              <View style={styles.overlay}>
                {banner.title && <Text style={styles.title}>{banner.title}</Text>}
                {banner.description && <Text style={styles.description}>{banner.description}</Text>}
              </View>
            )}
          </View>
        ))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 200,
    width: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    color: '#fff',
    fontSize: 13,
  },
});

export default React.memo(ImageSlider);
