import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/clerk-expo";

type Props = {
  productId: string;
  title?: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
};

const AddToCartButton = ({ productId, title = "أضف إلى السلة", buttonStyle, textStyle }: Props) => {
  const addToCart = useMutation(api.cart.addToCart.addToCart);
  const { user } = useUser();

  const handleAddToCart = async () => {
    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }
  
    try {
      await addToCart({
        userId: user.id,
        productId,
        quantity: 1,
      });
      alert("تمت إضافة المنتج للسلة");
    } catch (err) {
      console.error("فشل في الإضافة:", err);
      alert("حدث خطأ أثناء إضافة المنتج");
    }
  };
  

  return (
    <Pressable style={[styles.button, buttonStyle]} onPress={handleAddToCart}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#006348",
    padding: 12,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
  },
  text: {
    color: "#FFEDD6FF",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default AddToCartButton;
