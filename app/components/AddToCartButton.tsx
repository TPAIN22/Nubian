import { useState, useMemo } from "react";
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
import { useUser } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import useItemStore from "@/store/useItemStore";
import i18n from "@/utils/i18n";
import useTracking from "@/hooks/useTracking";
import type { Product, SelectedAttributes } from "@/types/cart.types";
import { 
  validateRequiredAttributes, 
  mergeSizeAndAttributes,
  findMatchingVariant,
  isProductAvailable,
  getProductStock
} from "@/utils/cartUtils";

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
  const { addToCart, clearError, fetchCart } = useCartStore();
  const { isSignedIn } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const { setSignInModelVisible } = useItemStore();
  const { trackEvent } = useTracking();

  // Get translated title dynamically
  const buttonTitle = title || i18n.t('addToCart');

  // Merge size and attributes for validation and submission
  const mergedAttributes = useMemo(() => {
    return mergeSizeAndAttributes(selectedSize, selectedAttributes);
  }, [selectedSize, selectedAttributes]);

  // Validate required attributes
  const validation = useMemo(() => {
    if (!product) return { valid: false, missing: [] };
    
    // For variant-based products, also check if a matching variant exists
    if (product.variants && product.variants.length > 0) {
      const attrValidation = validateRequiredAttributes(product.attributes, mergedAttributes);
      if (!attrValidation.valid) {
        return attrValidation;
      }
      
      // Check if selected attributes match a variant
      const matchingVariant = findMatchingVariant(product, mergedAttributes);
      if (!matchingVariant) {
        return {
          valid: false,
          missing: ['Please select a valid combination of attributes']
        };
      }
      
      return { valid: true, missing: [] };
    }
    
    return validateRequiredAttributes(product.attributes, mergedAttributes);
  }, [product, mergedAttributes]);

  // Check product/variant availability
  const isAvailable = useMemo(() => {
    if (!product) return false;
    return isProductAvailable(product, mergedAttributes);
  }, [product, mergedAttributes]);

  // Check if button should be disabled
  const isButtonDisabled = useMemo(() => {
    const result = disabled || isLoading || !validation.valid || !isAvailable;
    
    // Debug logging to help identify why button is disabled
    if (__DEV__ && result && product) {
      console.log('AddToCartButton disabled:', {
        disabled,
        isLoading,
        validationValid: validation.valid,
        validationMissing: validation.missing,
        isAvailable,
        productId: product._id,
        productIsActive: product.isActive,
        productStock: product.stock,
        hasVariants: !!(product.variants && product.variants.length > 0),
        selectedAttributes: mergedAttributes,
      });
    }
    
    return result;
  }, [disabled, isLoading, validation.valid, isAvailable, product, mergedAttributes, validation.missing]);

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

      // Check availability
      if (!isAvailable) {
        const stock = getProductStock(product, mergedAttributes);
        const toastConfig: any = {
          type: 'error',
          text1: i18n.t('productUnavailable') || 'Product unavailable',
        };
        if (stock === 0) {
          toastConfig.text2 = 'Out of stock';
        } else {
          toastConfig.text2 = 'This combination is not available';
        }
        Toast.show(toastConfig);
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

      // Track add to cart event
      trackEvent('add_to_cart', {
        productId: product._id,
        screen: 'product_details',
      });

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
      
      const toastConfig: any = {
        type: "error",
        text1: i18n.t('addToCartError'),
        visibilityTime: 4000,
      };
      
      if (typeof finalErrorMessage === 'string' && finalErrorMessage !== i18n.t('addToCartError')) {
        toastConfig.text2 = finalErrorMessage;
      }
      
      Toast.show(toastConfig);
    } finally {
      setIsLoading(false);
    }
  };

  // Show helpful message when disabled (for debugging)
  const disabledReason = useMemo(() => {
    if (!product) return 'No product';
    if (isLoading) return 'Loading...';
    if (!validation.valid) {
      return `Missing: ${validation.missing.join(', ')}`;
    }
    if (!isAvailable) {
      const stock = getProductStock(product, mergedAttributes);
      return stock === 0 ? 'Out of stock' : 'Not available';
    }
    if (disabled) return 'Disabled';
    return null;
  }, [product, isLoading, validation.valid, validation.missing, isAvailable, disabled, mergedAttributes]);

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
          <View style={styles.buttonContent}>
            <Text style={[styles.text, textStyle]}>{buttonTitle}</Text>
            {isButtonDisabled && disabledReason && __DEV__ && (
              <Text style={styles.disabledReasonText}>({disabledReason})</Text>
            )}
          </View>
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
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  disabledReasonText: {
    color: "#FFFFFFFF",
    fontSize: 10,
    marginTop: 2,
    opacity: 0.8,
  },
});

export default AddToCartButton;