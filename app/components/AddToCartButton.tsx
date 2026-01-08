import React, { useState, useMemo } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
  ActivityIndicator,
  I18nManager,
} from "react-native";
import useCartStore from "@/store/useCartStore";
import { useUser } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import useItemStore from "@/store/useItemStore";
import i18n from "@/utils/i18n";
import type { Product, SelectedAttributes } from "@/types/cart.types";
import { validateRequiredAttributes, mergeSizeAndAttributes } from "@/utils/cartUtils";

type Props = {
  product: Product;
  title?: string;
  buttonStyle?: ViewStyle | any;
  textStyle?: TextStyle;
  disabled?: boolean;
  selectedSize?: string; // Legacy support
  selectedAttributes?: SelectedAttributes; // New generic attributes
};

const AddToCartButton = ({
  product,
  title,
  buttonStyle,
  textStyle,
  disabled,
  selectedSize,
  selectedAttributes,
}: Props) => {
  const { addToCart, clearError, fetchCart, error } = useCartStore();
  const { isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const { signInModelVisible, setSignInModelVisible } = useItemStore();

  // Get translated title dynamically
  const buttonTitle = title || i18n.t('addToCart');

  // Merge size and attributes for validation and submission
  const mergedAttributes = useMemo(() => {
    return mergeSizeAndAttributes(selectedSize, selectedAttributes);
  }, [selectedSize, selectedAttributes]);

  // Validate required attributes
  const validation = useMemo(() => {
    if (!product) return { valid: false, missing: [] };
    return validateRequiredAttributes(product.attributes, mergedAttributes);
  }, [product, mergedAttributes]);

  // Check if button should be disabled
  const isButtonDisabled = useMemo(() => {
    return disabled || isLoading || !validation.valid || product?.stock === 0;
  }, [disabled, isLoading, validation.valid, product?.stock]);

  const handleAddToCart = async () => {
    if (isButtonDisabled) {
      return;
    }

    // Validate required attributes
    if (!validation.valid) {
      const missingText = validation.missing.join(', ');
      Toast.show({
        type: 'info',
        text1: i18n.t('selectAttributesFirst') || 'Please select required attributes',
        text2: `Missing: ${missingText}`,
      });
      return;
    }

    try {
      if (!product || !product._id) {
        Toast.show({
          type: "error",
          text1: i18n.t('productUnavailable'),
        });
        return;
      }

      setIsLoading(true);
      clearError?.();

      if (!isSignedIn) {
        setSignInModelVisible(true);
        Toast.show({
          type: "error",
          text1: i18n.t('pleaseSignInFirst'),
        });
        setIsLoading(false);
        return;
      }

      // Pass both size (for backward compatibility) and attributes
      await addToCart(
        product._id,
        1,
        selectedSize || '',
        selectedAttributes
      );

      // Refresh cart to update badge
      setTimeout(async () => {
        try {
          await fetchCart();
        } catch (error) {
          console.log('Error refreshing cart:', error);
        }
      }, 100);

      Toast.show({
        type: "success",
        text1: i18n.t('addedToCart'),
      });
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      console.error('Error response:', err?.response?.data);
      console.error('Error message:', err?.message);
      
      // Get error message from the caught error
      const errorMessage = err?.response?.data?.message || err?.message || i18n.t('addToCartError');
      
      // Also check the store error state
      const storeError = useCartStore.getState().error;
      const finalErrorMessage = storeError || errorMessage;
      
      Toast.show({
        type: "error",
        text1: i18n.t('addToCartError'),
        text2: typeof finalErrorMessage === 'string' && finalErrorMessage !== i18n.t('addToCartError') 
          ? finalErrorMessage 
          : undefined,
        visibilityTime: 4000,
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
          isButtonDisabled && styles.disabledButton
        ]}
        onPress={handleAddToCart}
        disabled={isButtonDisabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFFFF" />
        ) : (
          <Text style={[styles.text, textStyle]}>{buttonTitle}</Text>
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
    backgroundColor: "#f0b745",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  disabledButton: {
    opacity: 0.7,
    padding: 14,
  },
  text: {
    color: "#FFFFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default AddToCartButton;