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
import {useCartStore} from "@/store/useCartStore";
import { useUser, useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import useItemStore from "@/store/useItemStore";

type Product = {
  _id: string;
  quantity?: number;
  size?: string;
  [key: string]: any;
};

type Props = {
  product: Product;
  title?: string;
  buttonStyle?: ViewStyle | any;
  textStyle?: TextStyle;
  disabled?: boolean;
  selectedSize?: string
};

const AddToCartButton = ({
  product,
  title = "Add to cart",
  buttonStyle,
  textStyle,
  disabled,
  selectedSize
}: Props) => {
  const { addToCart, clearError } = useCartStore();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const {signInModelVisible, setSignInModelVisible} = useItemStore()

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
        setSignInModelVisible(true);
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

      await addToCart(token , product._id , 1 , selectedSize || '');
      Toast.show({
        type: "success",
        text1: "تمت إضافة المنتج إلى السلة",
      });
    } catch (err) {
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
    backgroundColor: "#30a1a7",
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