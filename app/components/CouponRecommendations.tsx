import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Text as UIText } from '@/components/ui/text';
import axiosInstance from '@/utils/axiosInstans';
import { useAuth } from '@clerk/clerk-expo';
import Colors from '@/locales/brandColors';

interface CouponRecommendation {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  discountPreview?: {
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
  };
}

interface CouponRecommendationsProps {
  cartItems: any[];
  orderAmount: number;
  onCouponSelect?: (coupon: CouponRecommendation) => void;
}

export default function CouponRecommendations({
  cartItems,
  orderAmount,
  onCouponSelect,
}: CouponRecommendationsProps) {
  const { userId } = useAuth();
  const [recommendations, setRecommendations] = useState<CouponRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!cartItems || cartItems.length === 0 || !orderAmount || orderAmount <= 0) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Extract product IDs, category IDs, and merchant IDs from cart
        const productIds: string[] = [];
        const categoryIds: string[] = [];
        const merchantIds: string[] = [];

        cartItems.forEach((item) => {
          if (item.product?._id) {
            productIds.push(item.product._id);
          }
          if (item.product?.category?._id) {
            categoryIds.push(item.product.category._id);
          } else if (item.product?.category) {
            categoryIds.push(item.product.category);
          }
          if (item.product?.merchant?._id) {
            merchantIds.push(item.product.merchant._id);
          } else if (item.product?.merchant) {
            merchantIds.push(item.product.merchant);
          }
        });

        // Build query parameters
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        params.append('orderAmount', orderAmount.toString());
        if (productIds.length > 0) {
          params.append('productIds', productIds.join(','));
        }
        if (categoryIds.length > 0) {
          params.append('categoryIds', categoryIds.join(','));
        }
        if (merchantIds.length > 0) {
          params.append('merchantIds', merchantIds.join(','));
        }

        const response = await axiosInstance.get(`/coupons/available?${params.toString()}`);

        if (response.data?.success && response.data?.data) {
          // Filter coupons that meet minimum order amount
          const validCoupons = response.data.data.filter((coupon: CouponRecommendation) => {
            if (coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
              return false;
            }
            return true;
          });

          // Sort by discount amount (descending) and limit to top 3
          const sortedCoupons = validCoupons
            .sort((a: CouponRecommendation, b: CouponRecommendation) => {
              const discountA = a.discountPreview?.discountAmount || 0;
              const discountB = b.discountPreview?.discountAmount || 0;
              return discountB - discountA;
            })
            .slice(0, 3);

          setRecommendations(sortedCoupons);
        } else {
          setRecommendations([]);
        }
      } catch (err: any) {
        console.error('Error fetching coupon recommendations:', err);
        setError('');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [cartItems, orderAmount, userId]);

  if (loading || recommendations.length === 0) {
    return null;
  }

  const handleCouponSelect = (coupon: CouponRecommendation) => {
    if (onCouponSelect) {
      onCouponSelect(coupon);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>كوبونات متاحة لك</Text>
        <Text style={styles.subtitle}>استخدم أحد هذه الكوبونات ووفر المزيد</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recommendations.map((coupon) => {
          const discountAmount = coupon.discountPreview?.discountAmount || 0;
          const finalAmount = coupon.discountPreview?.finalAmount || orderAmount;

          return (
            <TouchableOpacity
              key={coupon._id}
              style={styles.couponCard}
              onPress={() => handleCouponSelect(coupon)}
              activeOpacity={0.7}
            >
              <View style={styles.couponHeader}>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeText}>{coupon.code}</Text>
                </View>
                {coupon.type === 'percentage' ? (
                  <View style={styles.percentageBadge}>
                    <Text style={styles.percentageText}>{coupon.value}%</Text>
                  </View>
                ) : (
                  <View style={styles.fixedBadge}>
                    <Text style={styles.fixedText}>
                      {discountAmount.toFixed(0)} ج.س
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.couponBody}>
                <View style={styles.discountInfo}>
                  <Text style={styles.discountLabel}>وفر</Text>
                  <Text style={styles.discountAmount}>
                    {discountAmount.toFixed(2)} ج.س
                  </Text>
                </View>
                {coupon.minOrderAmount > 0 && (
                  <Text style={styles.minOrderText}>
                    الحد الأدنى: {coupon.minOrderAmount.toFixed(0)} ج.س
                  </Text>
                )}
              </View>

              <View style={styles.couponFooter}>
                <Text style={styles.finalAmountText}>
                  المبلغ النهائي: {finalAmount.toFixed(2)} ج.س
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingVertical: 8,
  },
  header: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text?.darkGray || '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text?.lightGray || '#666',
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  couponCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    maxWidth: 250,
    borderWidth: 2,
    borderColor: '#30a1a7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeContainer: {
    flex: 1,
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#30a1a7',
    fontFamily: 'monospace',
  },
  percentageBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  fixedBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fixedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  couponBody: {
    marginBottom: 12,
  },
  discountInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  discountLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  discountAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  minOrderText: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  couponFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  finalAmountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
