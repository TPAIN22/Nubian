import React, { useState } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
} from "react-native";
import useCartStore from "@/store/useCartStore";
import { useUser, useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import { router } from "expo-router";

type Product = {
  _id: string;
  quantity?: number;
  size?: string;
  [key: string]: any;
};

type Props = {
  product: Product;
  title?: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

const AddToCartButton = ({
  product,
  title = "Add to cart",
  buttonStyle,
  textStyle,
  disabled,
}: Props) => {
  const { addToCart, errorMessage, clearError } = useCartStore();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (disabled) {
      return;
    }

    if (!product?.size && product?.category?.includes("ملابس")) {
      Toast.show({
        type: 'info',
        text1: 'يرجى اختيار المقاس أولاً',
      });
      return;
    }

    try {
      if (!product || !product._id) {
        Toast.show({
          type: "error",
          text1: "المنتج غير متوفر أو البيانات ناقصة",
        });
        return;
      }

      setIsLoading(true);
      clearError?.();

      if (!isSignedIn) {
        Toast.show({
          type: "error",
          text1: "يرجى تسجيل الدخول أولاً",
        });
        setIsLoading(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        Toast.show({
          type: "error",
          text1: "حدث خطأ في المصادقة",
        });
        setIsLoading(false);
        return;
      }

      await addToCart(product, token);
      Toast.show({
        type: "success",
        text1: "تمت إضافة المنتج إلى السلة",
      });
      router.push("/(tabs)/cart");
    } catch (err) {
      console.error("خطأ أثناء الإضافة للسلة:", err);
      Toast.show({
        type: "error",
        text1: "حدث خطأ أثناء إضافة المنتج للسلة",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          buttonStyle,
          (isLoading || disabled) && styles.disabledButton
        ]}
        onPress={handleAddToCart}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFEDD6" />
        ) : (
          <Text style={[styles.text, textStyle]}>{title}</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  button: {
    backgroundColor: "#006348",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  disabledButton: {
    opacity: 0.7,
    padding: 14,
  },
  text: {
    color: "#FFEDD6",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default AddToCartButton;