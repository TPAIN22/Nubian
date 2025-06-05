import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';

// <--- أضف onMount هنا كـ prop
export default function GifLoadingScreen({ onAnimationFinish, onMount }) {
  useEffect(() => {
    // <--- استدعاء onMount بمجرد ما المكون يتعرض لأول مرة
    if (onMount) {
      onMount();
    }

    // المؤقت الاحتياطي كما هو
    const fallbackTimer = setTimeout(() => {
      console.log('GIF_FALLBACK_TIMER_TRIGGERED: Animation did not signal completion or took too long.');
      onAnimationFinish();
    }, 5000); // 5 ثواني كحد أقصى للـ GIF، يمكنك تعديلها

    return () => clearTimeout(fallbackTimer);
  }, [onAnimationFinish, onMount]); // أضف onMount هنا

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