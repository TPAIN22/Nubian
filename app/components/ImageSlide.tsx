import React, { useState, useRef } from 'react';
import { View,  StyleSheet, Dimensions, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import Colors from "@/locales/brandColors";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderItem = ({ item }: { item: Banner }) => (
    <View style={{ width, height: 350 }}>
      <Image source={{ uri: item.image }} style={styles.image} contentFit="fill"/>
      {(item.title || item.description) && (
        <View style={styles.overlay}>
          {item.title && <Text style={styles.title}>{item.title}</Text>}
          {item.description && <Text style={styles.description}>{item.description}</Text>}
        </View>
      )}
    </View>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderPagination = () => (
    <View style={styles.pagination}>
      {banners.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={{ height: 200, overflow: 'hidden'}}>
      <FlatList
        ref={flatListRef}
        data={banners}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      {renderPagination()}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 200,
    resizeMode: 'contain',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlay,
    padding: 10 ,
  },
  title: {
    color: Colors.text.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    color: Colors.text.white,
    fontSize: 13,
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.text.white,
  },
});

export default React.memo(ImageSlider);
