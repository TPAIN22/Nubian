import { View, Text, Pressable, StyleSheet, Dimensions, Animated } from 'react-native'
import { useState, useRef } from 'react'
import i18n from '@/utils/i18n';

const { width } = Dimensions.get('window');

interface CheckoutProps {
  total: number;
  handleCheckout: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function Checkout({ total, handleCheckout, isLoading = false, disabled = false }: CheckoutProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        tension: 150,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!disabled && !isLoading) {
      handleCheckout();
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.buttonContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <Pressable
          style={[
            styles.button,
            (disabled || isLoading) && styles.buttonDisabled,
            isPressed && styles.buttonPressed,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isLoading}
          android_ripple={{
            color: 'rgba(255, 255, 255, 0.2)',
            borderless: false,
          }}
        >
          <View style={styles.buttonContent}>
            <View style={styles.checkoutSection}>
              {isLoading ? (
                <Text style={[styles.text, styles.loadingText]}>
                  {i18n.t('processing') || 'Processing...'}
                </Text>
              ) : (
                <Text style={styles.text}>{i18n.t('checkout')}</Text>
              )}
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.amountSection}>
              <Text style={styles.currencyLabel}>SDG</Text>
              <Text style={styles.textAmount}>{formatAmount(total)}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    paddingVertical: 2,
    paddingHorizontal: 16,
    width: width,
    position: 'relative',
  },
  
  buttonContainer: {
    width: '100%',
  },
  
  button: {
    backgroundColor: "#f0b745",
    borderRadius: 8,
    overflow: 'hidden',    
  },
  
  buttonPressed: {
    backgroundColor: "#e6a63a",
  },
  
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    minHeight: 60,
  },
  
  checkoutSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  
  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: 'uppercase',
    letterSpacing: 1,
  
  },
  
  loadingText: {
    opacity: 0.8,
  },
  
  divider: {
    width: 2,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  
  amountSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  
  currencyLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  textAmount: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '900',
    
  },
  
  shadowLayer: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    height: 56,
    backgroundColor: 'rgba(240, 183, 69, 0.1)',
    borderRadius: 16,
    zIndex: -1,
  },
});

// Usage example with additional props:
/*
<Checkout 
  total={250.75}
  handleCheckout={() => console.log('Checkout pressed')}
  isLoading={false}
  disabled={false}
/>
*/