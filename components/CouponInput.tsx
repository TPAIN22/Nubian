import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import axiosInstance from "@/services/api/client";

interface CouponInputProps {
  products: { productId: string; categoryId?: string }[];
  userId?: string;
  orderAmount?: number; // Total order amount for validation
  cartItems?: any[]; // Cart items for product/category validation
  onValidate?: (result: CouponValidationResult | null) => void;
}

export type CouponValidationResult = {
  code: string;
  valid: boolean;
  type: 'percentage' | 'fixed';
  value: number;
  discountAmount: number; // Calculated discount amount
  originalAmount: number; // Original order amount
  finalAmount: number; // Final amount after discount
  minOrderAmount?: number;
  maxDiscount?: number;
  message?: string;
  errors?: string[];
  // Legacy fields for backward compatibility
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  expiresAt?: string;
};

export default function CouponInput({ 
  products, 
  userId, 
  orderAmount,
  onValidate 
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouponValidationResult | null>(null);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!couponCode.trim()) {
      setError('يرجى إدخال كود الكوبون');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      // Use the new enhanced validation endpoint
      const productIds = products.map(p => p.productId).filter(Boolean);
      const queryParams = new URLSearchParams();
      if (userId) queryParams.append('userId', userId);
      if (orderAmount) queryParams.append('orderAmount', orderAmount.toString());
      if (productIds.length > 0) queryParams.append('productIds', productIds.join(','));
      
      const url = `/coupons/code/${couponCode.toUpperCase().trim()}?${queryParams.toString()}`;
      const res = await axiosInstance.get(url);
      
      if (res.data?.success && res.data?.data) {
        const couponData = res.data.data;
        const validation = couponData.validation;
        
        if (validation.valid) {
          const coupon = couponData.coupon;
          const discountPreview = couponData.discountPreview;
          
          const validationResult: CouponValidationResult = {
            code: coupon.code,
            valid: true,
            type: coupon.type,
            value: coupon.value,
            discountAmount: discountPreview?.discountAmount || 0,
            originalAmount: discountPreview?.originalAmount || orderAmount || 0,
            finalAmount: discountPreview?.finalAmount || (orderAmount || 0) - (discountPreview?.discountAmount || 0),
            minOrderAmount: coupon.minOrderAmount,
            maxDiscount: coupon.maxDiscount,
            message: 'Coupon is valid',
            // Legacy fields
            discountType: coupon.type,
            discountValue: coupon.value,
            expiresAt: coupon.endDate,
          };
          
          setResult(validationResult);
          setError('');
          if (onValidate) onValidate(validationResult);
        } else {
          // Coupon exists but validation failed
          const errorMessage = validation.errors?.[0] || 'Coupon is not valid';
          setError(errorMessage);
          setResult(null);
          if (onValidate) onValidate(null);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      setResult(null);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error?.message ||
                          'حدث خطأ أثناء التحقق من الكوبون';
      setError(errorMessage);
      if (onValidate) onValidate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCouponCode('');
    setResult(null);
    setError('');
    if (onValidate) onValidate(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="أدخل كود الكوبون"
          placeholderTextColor="#999"
          value={couponCode}
          onChangeText={(text) => {
            setCouponCode(text.toUpperCase().trim());
            if (result || error) {
              setResult(null);
              setError('');
            }
          }}
          editable={!loading}
          autoCapitalize="characters"
        />
        {couponCode && !loading && (
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={handleRemove}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.button, (!couponCode || loading) && styles.buttonDisabled]} 
          onPress={handleValidate} 
          disabled={loading || !couponCode}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>تحقق</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {result && result.valid && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>
            ✓ كوبون صالح! خصم {result.discountAmount.toFixed(2)} ج.س
          </Text>
          {result.type === 'percentage' && (
            <Text style={styles.successSubtext}>
              ({result.value}% خصم)
            </Text>
          )}
          {result.minOrderAmount && result.minOrderAmount > 0 && (
            <Text style={styles.infoText}>
              الحد الأدنى للطلب: {result.minOrderAmount} ج.س
            </Text>
          )}
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    textAlign: 'right',
    fontSize: 16,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#30a1a7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  successContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  successText: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'right',
  },
  successSubtext: {
    color: '#4caf50',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  infoText: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'right',
  },
});
