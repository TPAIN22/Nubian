import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useCartStore from "@/store/useCartStore";
import { useAuth } from "@clerk/clerk-expo";

interface CartBadgeProps {
  size?: number;
  fontSize?: number;
}

const CartBadge: React.FC<CartBadgeProps> = ({ 
  size = 20, 
  fontSize = 10 
}) => {
  const { cart, fetchCart } = useCartStore();
  const { getToken } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  // حساب عدد العناصر في السلة
  useEffect(() => {
    const calculateCartCount = () => {
      if (cart?.products && Array.isArray(cart.products)) {
        const count = cart.products.reduce((total: number, item: any) => {
          return total + (item.quantity || 1);
        }, 0);
        setCartItemCount(count);
      } else {
        setCartItemCount(0);
      }
    };

    calculateCartCount();
  }, [cart]);

  // جلب بيانات السلة عند تحميل المكون
  useEffect(() => {
    const loadCart = async () => {
      try {
        const token = await getToken();
        if (token) {
          await fetchCart(token);
        }
      } catch (error) {
        console.log('Error loading cart:', error);
      }
    };

    loadCart();
  }, []);

  if (cartItemCount === 0) {
    return null;
  }

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.badgeText, { fontSize }]}>
        {cartItemCount > 99 ? '99+' : cartItemCount.toString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f0b745',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: '#fff',
    minWidth: 20,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default CartBadge; 