import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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

    return () => clearTimeout(fallbackTimer);
  }, [onAnimationFinish, onMount]);

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Image
          source={require('../assets/images/logo.gif')}
          style={styles.gif}
          contentFit="contain"
          onAnimationEnd={onAnimationFinish}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  gif: {
    width: 300,
    height: 300,
  },
});