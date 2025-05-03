import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, Animated } from 'react-native';
import { useSlidingAnimation } from '@/utils/animationUtils';

const deals = [
  { id: 1, name: 'Deal 1', image: require('../../../assets/images/deal1.png') },
  { id: 2, name: 'Deal 2', image: require('../../../assets/images/deal2.png') },
  { id: 3, name: 'Deal 3', image: require('../../../assets/images/deal3.png') },
  { id: 4, name: 'Deal 4', image: require('../../../assets/images/deal4.png') },
  { id: 5, name: 'Deal 5', image: require('../../../assets/images/deal5.png') },
];

const CardSliderShow = () => {
  const screenWidth = Dimensions.get('window').width;
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  let timer: NodeJS.Timeout;

  useEffect(() => {
    if (deals.length > 1) {
      timer = setInterval(() => {
        flatListRef.current?.scrollToOffset({
          offset: ((scrollX as any)._value + screenWidth) % (deals.length * screenWidth),
          animated: true,
        });
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [deals, scrollX]);

  return (
    <View>
      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        data={deals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Animated.View
            style={[styles.card, { width: screenWidth }]}
          >
            <Image source={item.image} style={styles.cardImage} />
          </Animated.View>
        )}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      />
      <View style={styles.paginationContainer}>
        {deals.map((_, index) => {
          const inputRange = [
            (index - 1) * screenWidth,
            index * screenWidth,
            (index + 1) * screenWidth
          ];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp'
          });
          return (
            <Animated.View
              key={index}
              style={[styles.paginationDot, { width: dotWidth }]}
            />
          );
        })}
      </View>
    </View>
  );
};

const Subcategories = () => {
  return (
    <View style={styles.container}>
      <CardSliderShow />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 2,
    padding: 2,
    
    elevation: 2,
    marginHorizontal: 1,
  },
  cardText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardImage: {
    width: 390,
    height: 150,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    opacity: 4, // Hide the dots
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#333',
  },
});

export default Subcategories;