import { View, Pressable, StyleSheet, Dimensions, Animated } from 'react-native'
import { Text } from '@/components/ui/text'
import { useState, useRef } from 'react'
import i18n from '@/utils/i18n';
import Colors from "@/locales/brandColors";
import { useTheme } from "@/providers/ThemeProvider";

const { width } = Dimensions.get('window');

interface CheckoutProps {
  total: number;
  handleCheckout: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function Checkout({ total, handleCheckout, isLoading = false, disabled = false }: CheckoutProps) {
  const { theme } = useTheme();
  const Colors = theme.colors;
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
            { backgroundColor: Colors.text.black },
            (disabled || isLoading) && { backgroundColor: Colors.gray[400] },
            isPressed && { backgroundColor: Colors.gray[800] },
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isLoading}
          android_ripple={{
            color: `${Colors.text.white}33`,
            borderless: false,
          }}
        >
          <View style={styles.buttonContent}>
            <View style={styles.checkoutSection}>
              {isLoading ? (
                <Text style={[styles.text, styles.loadingText, { color: Colors.text.white }]}>
                  {i18n.t('processing') || 'Processing...'}
                </Text>
              ) : (
                <Text style={[styles.text, { color: Colors.text.white }]}>{i18n.t('checkout')}</Text>
              )}
            </View>
            
            <View style={[styles.divider, { backgroundColor: `${Colors.text.white}4D` }]} />
            
            <View style={styles.amountSection}>
              <Text style={[styles.currencyLabel, { color: `${Colors.text.white}CC` }]}>SDG</Text>
              <Text style={[styles.textAmount, { color: Colors.text.white }]}>{formatAmount(total)}</Text>
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
    borderRadius: 8,
    overflow: 'hidden',    
  },
  
  buttonPressed: {
  },
  
  buttonDisabled: {
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
    marginHorizontal: 16,
  },
  
  amountSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  
  currencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  textAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  
  shadowLayer: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    height: 56,
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