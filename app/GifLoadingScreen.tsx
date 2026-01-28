import React, { useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Video, AVPlaybackStatus } from "expo-av";

interface GifLoadingScreenProps {
  onAnimationFinish?: () => void;
  onMount?: () => void;
  fallbackTimeout?: number;
}

const GifLoadingScreen: React.FC<GifLoadingScreenProps> = ({ 
  onAnimationFinish, 
  onMount,
  fallbackTimeout = 5000 
}) => {
  // Fix: Make the ref nullable
  const videoRef = useRef<Video | null>(null);
  const finishedRef = useRef<boolean>(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleFinish = useCallback((): void => {
    if (!finishedRef.current) {
      finishedRef.current = true;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
      onAnimationFinish?.();
    }
  }, [onAnimationFinish]);

  useEffect(() => {
    onMount?.();

    fallbackTimerRef.current = setTimeout(handleFinish, fallbackTimeout);

    return (): void => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [handleFinish, onMount, fallbackTimeout]);

  const onStatusUpdate = useCallback((status: AVPlaybackStatus): void => {
    if (!status.isLoaded) return;

    if (status.didJustFinish) {
      handleFinish();
    }
  }, [handleFinish]);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require("../assets/images/logo.mp4")}
        style={styles.video}
        shouldPlay
        isLooping={false}
        isMuted
        onPlaybackStatusUpdate={onStatusUpdate}
      />
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  video: {
    width,
    height,
  },
});

export default GifLoadingScreen;