import { useState, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * A custom hook to create a sliding animation that loops every 3 seconds.
 * @param {number} totalSlides - The total number of slides.
 * @returns {number} The current slide index.
 */
export const useSlidingAnimation = (totalSlides: number): number => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    }, 3000);

    return () => clearInterval(interval);
  }, [totalSlides]);

  return currentIndex;
};

/**
 * A function to create a slide-to-left animation.
 * @param {Animated.Value} animatedValue - The animated value to drive the animation.
 * @param {number} screenWidth - The width of the screen to determine the slide distance.
 */
export const slideToLeft = (animatedValue: Animated.Value, screenWidth: number) => {
  Animated.timing(animatedValue, {
    toValue: -screenWidth,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    animatedValue.setValue(0); // Reset the position for looping
  });
};