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

type Props = {
  product: {
    _id:any,
    quantity?: number;
    size?: string;
    [key: string]: any;
  };
  title?: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
};

const AddToCartButton = ({
  product,
  title = "Add to cart",
  buttonStyle,
  textStyle,
}: Props) => {
  const { addToCart, errorMessage, clearError , getCartItms } = useCartStore();
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      clearError?.();
      
      if (!isSignedIn) {
        setIsLoading(false);
        return;
      }
      
      const token = await getToken();
      if (!token) {
        console.log("Authentication token not available");
        setIsLoading(false);
        return;
      }
      
      await addToCart(product, token, product.quantity || 1,);
      Toast.show({
        type: "success",
        text1: "Product added to cart successfully",
      });  
    } catch (err) {
    } finally {
      setIsLoading(false);
      if (errorMessage) {
        Toast.show({
          type: "error",
          text1: errorMessage,
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.button,
          buttonStyle,
          isLoading && styles.disabledButton
        ]}
        onPress={handleAddToCart}
        disabled={isLoading}
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
  errorText: {
    color: "#E53935",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});

export default AddToCartButton;