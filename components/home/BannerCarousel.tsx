import React, { memo, useState, useCallback } from "react";
import { View, StyleSheet, Pressable, I18nManager } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Carousel from "react-native-reanimated-carousel";
import { useResponsive } from "@/hooks/useResponsive";
import { useTracking } from "@/hooks/useTracking";
import { navigateBanner } from "@/utils/deepLinks";

export const BannerCarousel = memo(
  ({ banners, colors }: { banners: any[]; colors: any }) => {
    const isRTL = I18nManager.isRTL;
    const { window } = useResponsive();
    const screenWidth = window.width;
    const bannerHeight = screenWidth * 1.1; // Tall banner matching Shein proportion
    const [activeIndex, setActiveIndex] = useState(0);
    const { trackEvent } = useTracking();

    const onProgressChange = useCallback((_: number, absoluteProgress: number) => {
      const index = Math.round(absoluteProgress) % banners.length;
      // ensure index is positive
      const safeIndex = index < 0 ? index + banners.length : index;
      setActiveIndex(safeIndex);
    }, [banners.length]);

    const renderBannerItem = useCallback(({ item }: { item: any }) => (
      <Pressable
        onPress={() => {
          trackEvent('banner_click', {
            bannerId: item._id,
            screen: 'home',
          });
          navigateBanner(item);
        }}
        style={{ width: screenWidth, height: bannerHeight }}
      >
        <Image
          source={{ uri: item.image }}
          style={[styles.bannerImage, { width: screenWidth, height: bannerHeight }]}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={[
            "transparent",
            colors.overlayDark || "rgba(0,0,0,0.8)",
          ]}
          style={styles.bannerOverlay}
        />
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.4)",
            "transparent",
          ]}
          style={styles.bannerTopOverlay}
        />
        {(item.title || item.description) && (
          <View style={styles.bannerContent}>
            {item.title && (
              <Text style={[styles.bannerTitle, { color: colors.text.white }]}>
                {item.title}
              </Text>
            )}
            {item.description && (
              <Text style={[styles.bannerDescription, { color: colors.text.white }]}>
                {item.description}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    ), [screenWidth, bannerHeight, colors, trackEvent]);

    if (banners.length === 0) return null;

    return (
      <View style={styles.bannersSection}>
        <Carousel
          data={banners}
          width={screenWidth}
          height={bannerHeight}
          loop={banners.length > 1}
          autoPlay={banners.length > 1}
          autoPlayInterval={3500}
          scrollAnimationDuration={800}
          onProgressChange={onProgressChange}
          renderItem={renderBannerItem}
        />

        {banners.length > 1 && (
          <View
            style={[styles.pagination, isRTL && { flexDirection: "row-reverse" }]}
          >
            {banners.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeIndex
                        ? colors.primary
                        : "rgba(255,255,255,0.3)",
                    width: i === activeIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);
BannerCarousel.displayName = "BannerCarousel";

const styles = StyleSheet.create({
  bannersSection: { position: "relative" },
  bannerImage: {},
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // reduce the bottom overlay a bit so it doesn't take half the image
  },
  bannerTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140, // Enough to cover the header text/icons gracefully
  },
  bannerContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bannerDescription: {
    fontSize: 12,
    opacity: 0.9,
  },
  pagination: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
