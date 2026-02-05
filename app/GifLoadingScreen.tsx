import React, { useEffect, useRef, useCallback, useState } from "react";
import { View, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { Image } from "expo-image";

// Conditionally import expo-video to handle Expo Go where it's not available
let VideoView: any = null;
let useVideoPlayer: any = null;
let useEventListener: any = null;

try {
  const expoVideo = require("expo-video");
  VideoView = expoVideo.VideoView;
  useVideoPlayer = expoVideo.useVideoPlayer;
  const expo = require("expo");
  useEventListener = expo.useEventListener;
} catch (e) {
  // expo-video not available (e.g., running in Expo Go)
  console.log("[GifLoadingScreen] expo-video not available, using fallback");
}

interface GifLoadingScreenProps {
  onAnimationFinish?: () => void;
  onMount?: () => void;
  fallbackTimeout?: number;
}

// Fallback component when expo-video is not available
const FallbackLoadingScreen: React.FC<GifLoadingScreenProps> = ({
  onAnimationFinish,
  onMount,
  fallbackTimeout = 2000, // Shorter timeout for fallback
}) => {
  useEffect(() => {
    onMount?.();
    
    // Just show the logo and finish after a short delay
    const timer = setTimeout(() => {
      onAnimationFinish?.();
    }, fallbackTimeout);
    
    return () => clearTimeout(timer);
  }, [onAnimationFinish, onMount, fallbackTimeout]);

  return (
    <View style={styles.container}>
      <View style={styles.fallbackContainer}>
        <Image
          source={require("../assets/images/nubianLogo.png")}
          style={styles.fallbackLogo}
          contentFit="contain"
        />
        <ActivityIndicator size="large" color="#C4A77D" style={styles.spinner} />
      </View>
    </View>
  );
};

// Video loading screen component
const VideoLoadingScreen: React.FC<GifLoadingScreenProps> = ({ 
  onAnimationFinish, 
  onMount,
  fallbackTimeout = 5000 
}) => {
  const finishedRef = useRef<boolean>(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const player = useVideoPlayer(require("../assets/images/logo.mp4"), (player: any) => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

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

  useEventListener(player, "playToEnd", handleFinish);

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
      />
    </View>
  );
};

// Main component that chooses between video and fallback
const GifLoadingScreen: React.FC<GifLoadingScreenProps> = (props) => {
  // Use video player if available, otherwise use fallback
  if (VideoView && useVideoPlayer && useEventListener) {
    return <VideoLoadingScreen {...props} />;
  }
  
  return <FallbackLoadingScreen {...props} />;
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
  fallbackContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  fallbackLogo: {
    width: width * 0.5,
    height: width * 0.5,
  },
  spinner: {
    marginTop: 20,
  },
});

export default GifLoadingScreen;
