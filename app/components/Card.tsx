import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import useItemStore from "@/store/useItemStore";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Swiper from "react-native-swiper";
interface item {
  _id: string;
  name: string;
  price: number;
  images?: string[];
  discountPrice?: number;
}
function ItemCard({ item , handleSheetChanges , handlePresentModalPress }: any) {
  const { setProduct ,setIsTabBarVisible } = useItemStore();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth / 2 - 10;
  const router = useRouter();
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-SDG", {
      style: "currency",
      currency: "SDG",
    }).format(price);
  };

  const calculateDiscountPercentage = (
    originalPrice: number,
    discountedPrice: number
  ) => {
    if (
      !originalPrice ||
      !discountedPrice ||
      originalPrice <= 0 ||
      discountedPrice < 0
    ) {
      return 0;
    }

    if (discountedPrice >= originalPrice) {
      return 0;
    }
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  const discountPercentage = calculateDiscountPercentage(
    item.discountPrice,
    item.price || 0
  );

  const handleClick = (item: item) => {
    setProduct(item);
    router.push(`/${item._id}`);
  };

  return (
    <Card className="p-0 rounded-lg bg-white my-2" style={{ width: cardWidth }}>
      <Swiper
        loop={true}
        showsPagination={false}
        style={{ height: 200, overflow: "hidden" }}
      >
        {item.images?.map((uri: string, index: number) => (
          <Pressable key={index} onPress={() => handleClick(item)}>
          <Image
            key={index}
            source={uri}
            alt="product image"
            style={{
              height: 200,
              width: cardWidth,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
          </Pressable>
        ))}
      </Swiper>
      <View className="p-4">
        <VStack className="">
          <Heading size="md" className="text-right">
            {item.name}
          </Heading>
          {item.discountPrice > 0 &&
            <Text className="text-right line-through text-[#e98c22]">
            {item.discountPrice > 0 && formatPrice(item.discountPrice)}
          </Text>
          }
          <Text className="text-right text-[#30a1a7] font-bold text-lg">
            {formatPrice(item.price)} SDG
          </Text>
        </VStack>
      </View>

      <Box className="flex-col sm:flex-row">
        <Button
          className="px-4 py-2 mr-0 sm:mr-3 sm:mb-0 sm:flex-1"
          onPress={() => {
            setProduct(item);
            setIsTabBarVisible(false);
            handlePresentModalPress();
          }}
        >
          <ButtonText size="sm">اضافة للسلة</ButtonText>
        </Button>
      </Box>
      {discountPercentage > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discountPercentage}% OFF </Text>
        </View>
      )}
    </Card>
  );
}
const styles = StyleSheet.create({
  discountBadge: {
    backgroundColor: "#e98c22",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-end",
    marginBottom: 10,
    shadowColor: "#000",
    position: "absolute",
    top: 5,
    right: 5,
  },

  discountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "System",
  },
});

export default React.memo(ItemCard)