import { memo, useEffect, useState, useCallback } from "react";
import { View, FlatList, Pressable, StyleSheet, InteractionManager } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Skeleton } from "moti/skeleton";
import Ionicons from "@expo/vector-icons/Ionicons";
import axiosInstance from "@/services/api/client";
import { navigateToStore } from "@/utils/deepLinks";
import { useTracking } from "@/hooks/useTracking";
import i18n from "@/utils/i18n";

interface Merchant {
  _id: string;
  name: string;
  logo?: string | null;
}

interface Props {
  colors: any;
  isDark: boolean;
}

export const StoreHighlights = memo(({ colors, isDark }: Props) => {
  const { trackEvent } = useTracking();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMerchants = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/merchants/list", { params: { limit: 10 } });

      const body = res.data?.data ?? res.data;
      const list: any[] = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];

      setMerchants(
        list.map((m: any) => ({
          _id:  String(m._id),
          name: m.storeName || m.name || "Store",
          logo: m.logoUrl ?? m.logo ?? null,
        }))
      );
    } catch {
      // silent — section simply won't render
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMerchants(); }, [fetchMerchants]);

  const handlePress = useCallback(
    (item: Merchant) => {
      navigateToStore(item._id, item);
      InteractionManager.runAfterInteractions(() => {
        trackEvent("store_open", { storeId: item._id, screen: "home" });
      });
    },
    [trackEvent]
  );

  if (!isLoading && merchants.length === 0) return null;

  const cm = isDark ? "dark" : "light";

  return (
    <View style={styles.section}>
      {/* Section header — same accent-bar pattern as ProductSection */}
      <View style={styles.header}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        <Text style={[styles.title, { color: colors.text.gray }]}>
          {i18n.t("home_topStores")}
        </Text>
      </View>

      {isLoading ? (
        /* Skeleton row — same bubble dimensions */
        <View style={styles.bubblesContent}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              height={88}
              width={76}
              radius={14}
              colorMode={cm}
            />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={merchants}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.bubblesContent}
          renderItem={({ item }) => (
            <Pressable onPress={() => handlePress(item)} style={styles.bubble}>
              <View
                style={[
                  styles.bubbleImgWrap,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                ]}
              >
                {item.logo ? (
                  <Image
                    source={{ uri: item.logo }}
                    style={styles.bubbleImg}
                    contentFit="cover"
                    transition={200}
                    recyclingKey={item._id}
                  />
                ) : (
                  <Ionicons
                    name="storefront"
                    size={26}
                    color={colors.text.lightGray}
                  />
                )}

                {/* Same gradient as CategoryBubbles */}
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.68)"]}
                  start={{ x: 0, y: 0.45 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />

                <Text style={styles.bubbleName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
});
StoreHighlights.displayName = "StoreHighlights";

const styles = StyleSheet.create({
  section: { marginTop: 4 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 10,
  },
  accentBar: { width: 4, height: 20, borderRadius: 2 },
  title: { fontSize: 14, fontWeight: "bold" },

  /* ── Exact match to CategoryBubbles ── */
  bubblesContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 10,
    flexDirection: "row",
  },
  bubble: { width: 76 },
  bubbleImgWrap: {
    width: 76,
    height: 88,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleImg: { width: "100%", height: "100%" },
  bubbleName: {
    position: "absolute",
    bottom: 7,
    left: 5,
    right: 5,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    color: "#FFFFFF",
  },
});
