import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';

export default function GifLoadingScreen({ onAnimationFinish, onMount }) {
  useEffect(() => {
    if (onMount) {
      onMount();
    }

    const fallbackTimer = setTimeout(() => {
      onAnimationFinish();
    }, 5000); 

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, [onAnimationFinish, onMount]);

  return (
    <>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/logo.gif')}
          style={styles.gif}
          contentFit="cover"
          onAnimationEnd={onAnimationFinish}
        />
      </View>
    </>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  gif: {
    width: width,
    height: height,
  },
});