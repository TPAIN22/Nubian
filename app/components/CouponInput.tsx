import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axiosInstance from '@/utils/axiosInstans';

interface CouponInputProps {
  products: { productId: string; categoryId?: string }[];
  userId?: string;
  onValidate?: (result: CouponValidationResult | null) => void;
}

export type CouponValidationResult = {
  code: string;
  valid: boolean;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiresAt: string;
  message: string;
};

export default function CouponInput({ products, userId, onValidate }: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CouponValidationResult | null>(null);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await axiosInstance.post('/coupons/validate', {
        code: couponCode,
        userId,
        products
      });
      setResult({ code: couponCode, ...res.data });
      setError('');
      if (onValidate) onValidate({ code: couponCode, ...res.data });
    } catch (err: any) {
      setResult(null);
      setError(err.response?.data?.message || 'حدث خطأ أثناء التحقق من الكوبون');
      if (onValidate) onValidate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="أدخل كود الكوبون"
        value={couponCode}
        onChangeText={setCouponCode}
        editable={!loading}
      />
      <TouchableOpacity style={styles.button} onPress={handleValidate} disabled={loading || !couponCode}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>تحقق</Text>}
      </TouchableOpacity>
      {result && result.valid && (
        <Text style={styles.successText}>
          كوبون صالح! نوع الخصم: {result.discountType === 'percentage' ? 'نسبة' : 'قيمة ثابتة'}، قيمة الخصم: {result.discountValue}
        </Text>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    width: '80%',
    marginBottom: 8,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#30a1a7',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successText: {
    color: 'green',
    marginTop: 6,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginTop: 6,
    fontWeight: 'bold',
  },
}); 