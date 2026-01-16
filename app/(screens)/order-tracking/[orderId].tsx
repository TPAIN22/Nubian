import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams } from 'expo-router';
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Text } from '@/components/ui/text';
import axiosInstance from "@/services/api/client";
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useTheme } from '@/providers/ThemeProvider';

interface OrderItem {
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
}

interface SubOrder {
  _id?: string;
  merchantId: string;
  total: number;
  shippingFee: number;
  fulfillmentStatus: string;
  paymentStatus: string;
}

interface Order {
  _id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt?: string;
  orderSummary?: {
    subtotal: number;
    discount: number;
    total: number;
  };
  currency?: string;
  productsDetails?: OrderItem[];
  subOrders?: SubOrder[];
  // Backend order schema fields (optional)
  couponDetails?: {
    code?: string;
    type?: "percentage" | "fixed";
    value?: number;
    discountAmount?: number;
  };
  discountAmount?: number;
  address?: {
    name?: string;
    city?: string;
    street?: string;
    phone?: string;
    whatsapp?: string;
  };
}

const ORDER_STATUS = [
  { key: 'PLACED', label: 'قيد المعالجة', icon: 'hourglass-outline' },
  { key: 'VERIFIED', label: 'تم الدفع', icon: 'checkmark-done-outline' },
  { key: 'SHIPPED', label: 'تم الشحن', icon: 'cube-outline' },
  { key: 'DELIVERED', label: 'تم التسليم', icon: 'checkmark-circle-outline' },
];

const fetchOrder = async (orderId: string, token: string): Promise<Order> => {
  const res = await axiosInstance.get(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default function OrderTracking() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { orderId } = useLocalSearchParams();
  const { getToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  console.log('OrderTracking: Component mounted with orderId:', orderId);

  const lastFetchedOrderId = useRef<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      console.log('OrderTracking: useEffect triggered with orderId:', orderId);

      if (!orderId) {
        console.log('OrderTracking: No orderId provided');
        setLoading(false);
        return;
      }

      // Prevent duplicate fetches for the same orderId
      if (lastFetchedOrderId.current === orderId) {
        console.log('OrderTracking: Already fetched this orderId, skipping');
        return;
      }

      // Prevent concurrent fetches
      if (isFetching.current) {
        console.log('OrderTracking: Already fetching, skipping');
        return;
      }

      isFetching.current = true;
      lastFetchedOrderId.current = orderId as string;
      setLoading(true);

      try {
        console.log('OrderTracking: Getting token...');
        const token = await getToken();
        if (!token) {
          console.log('OrderTracking: No token available');
          throw new Error('لم يتم العثور على التوكن');
        }

        console.log('OrderTracking: Fetching order data for orderId:', orderId);
        const data = await fetchOrder(orderId as string, token);
        console.log('OrderTracking: Order data received:', data);

        setOrder(data);
        setError(null);
      } catch (err: any) {
        console.log('OrderTracking: Error fetching order:', err);
        setError(err);
        setOrder(null);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    fetchOrderData();
  }, [orderId]); // Only depend on orderId, getToken is stable from Clerk

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.surface }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.text.veryLightGray }]}>جاري تحميل تفاصيل الطلب...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.surface }]}>
        <Ionicons name="close-circle-outline" size={50} color={Colors.primary} />
        <Text style={[styles.errorText, { color: Colors.text.gray }]}>حدث خطأ أثناء جلب الطلب. الرجاء المحاولة مرة أخرى.</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.surface }]}>
        <Ionicons name="information-circle-outline" size={50} color={Colors.primary} />
        <Text style={[styles.noDataText, { color: Colors.text.gray }]}>لا يوجد بيانات للطلب لعرضها.</Text>
      </View>
    );
  }

  const currentStatusIndex = (() => {
    let stage = 0;
    if (order.paymentStatus === "VERIFIED" || order.paymentStatus === "paid") stage = 1;
    // For now, we'll use a simpler status logic until subOrders are implemented
    if (order.status === "shipped") stage = Math.max(stage, 2);
    if (order.status === "delivered") stage = 3;
    return stage;
  })();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: Colors.surface }]}>
      <View style={[styles.headerCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.title, { color: Colors.text.gray }]}>تتبع الطلب</Text>
        <Text style={[styles.orderId, { color: Colors.text.veryLightGray }]}>#{order._id}</Text>
        <Text style={[styles.date, { color: Colors.text.veryLightGray }]}>تاريخ الطلب: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير متوفر'}</Text>
      </View>

      <View style={[styles.timelineCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: Colors.text.gray }]}>حالة الطلب</Text>
        <View style={styles.timeline}>
          {ORDER_STATUS.map((status, idx) => (
            <View key={status.key} style={styles.timelineItem}>
              <View style={styles.iconCircleWrapper}>
                <View style={[
                  styles.circle, 
                  idx <= currentStatusIndex ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : { backgroundColor: Colors.borderLight, borderColor: Colors.borderLight }
                ]} />
                <Ionicons
                  name={status.icon as any} // Type assertion for icon name
                  size={20}
                  color={idx <= currentStatusIndex ? Colors.text.white : Colors.text.veryLightGray}
                  style={styles.icon}
                />
              </View>
              <Text style={[
                styles.statusLabel, 
                { color: idx <= currentStatusIndex ? Colors.text.gray : Colors.text.veryLightGray },
                idx <= currentStatusIndex && { fontWeight: 'bold' }
              ]}>
                {status.label}
              </Text>
              {idx < ORDER_STATUS.length - 1 && (
                <View style={[
                  styles.line, 
                  { backgroundColor: idx < currentStatusIndex ? Colors.primary : Colors.borderLight }
                ]} />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Coupon Information */}
      {order.couponDetails && order.couponDetails.code && (
        <View style={[styles.detailsCard, { backgroundColor: Colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors.text.gray }]}>معلومات الكوبون</Text>
          <View style={styles.couponInfo}>
            <Text style={[styles.couponLabel, { color: Colors.text.veryLightGray }]}>كود الكوبون:</Text>
            <Text style={[styles.couponCode, { color: Colors.primary }]}>{order.couponDetails.code}</Text>
          </View>
          {(order.orderSummary?.discount ?? 0) > 0 && (
            <View style={styles.couponInfo}>
              <Text style={[styles.couponLabel, { color: Colors.text.veryLightGray }]}>قيمة الخصم:</Text>
              <Text style={[styles.discountValue, { color: Colors.success }]}>
                {typeof order.discountAmount === 'number' && !isNaN(order.discountAmount) 
                  ? order.discountAmount.toFixed(2) 
                  : '0.00'} ج.س
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.detailsCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: Colors.text.gray }]}>تفاصيل المنتجات</Text>
        {order.productsDetails && order.productsDetails.length > 0 ? (
          order.productsDetails.map((item: any) => (
            <View key={`${item.productId}-${item.name}`} style={[styles.productItem, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
              <Text style={[styles.productName, { color: Colors.text.gray }]}>{item.name}</Text>
              <Text style={[styles.productQuantity, { color: Colors.text.veryLightGray }]}>الكمية: {item.quantity}</Text>
              <Text style={[styles.productPrice, { color: Colors.text.veryLightGray }]}>
                السعر: {typeof item.price === 'number' && !isNaN(item.price) ? item.price.toFixed(2) : '0.00'} ج.س
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noProductsText, { color: Colors.text.veryLightGray }]}>لا توجد منتجات في هذا الطلب.</Text>
        )}
      </View>

      {/* Order Summary */}
      {order.orderSummary && (
        <View style={[styles.detailsCard, { backgroundColor: Colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors.text.gray }]}>ملخص الطلب</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.text.veryLightGray }]}>المجموع الفرعي:</Text>
            <Text style={[styles.summaryValue, { color: Colors.text.gray }]}>
              {typeof order.orderSummary.subtotal === 'number' && !isNaN(order.orderSummary.subtotal)
                ? order.orderSummary.subtotal.toFixed(2)
                : '0.00'} ج.س
            </Text>
          </View>
          {order.orderSummary.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.text.veryLightGray }]}>الخصم:</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                -{typeof order.orderSummary.discount === 'number' && !isNaN(order.orderSummary.discount)
                  ? order.orderSummary.discount.toFixed(2)
                  : '0.00'} ج.س
              </Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.summaryLabel, { color: Colors.text.gray, fontWeight: 'bold' }]}>المجموع الكلي:</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: 'bold', fontSize: 18 }]}>
              {typeof order.orderSummary.total === 'number' && !isNaN(order.orderSummary.total)
                ? order.orderSummary.total.toFixed(2)
                : '0.00'} ج.س
            </Text>
          </View>
        </View>
      )}

      {/* Sub-orders section commented out until backend implements subOrders
      {order.subOrders && order.subOrders.length > 0 && (
        <View style={[styles.detailsCard, { backgroundColor: Colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors.text.gray }]}>حالة متاجر البائعين</Text>
          {order.subOrders.map((sub) => (
            <View key={sub._id || sub.merchantId} style={[styles.productItem, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
              <Text style={[styles.productName, { color: Colors.text.gray }]}>تاجر: {sub.merchantId}</Text>
              <Text style={[styles.productQuantity, { color: Colors.text.veryLightGray }]}>حالة الشحن: {sub.fulfillmentStatus}</Text>
              <Text style={[styles.productQuantity, { color: Colors.text.veryLightGray }]}>حالة الدفع: {sub.paymentStatus}</Text>
              <Text style={[styles.productPrice, { color: Colors.text.veryLightGray }]}>
                الإجمالي: {sub.total} (شحن {sub.shippingFee})
              </Text>
            </View>
          ))}
        </View>
      )} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    flexGrow: 1,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 18,
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
  },
  timelineCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  timeline: {
    alignItems: 'flex-start', // Align items to start for vertical timeline
    paddingHorizontal: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25, // Space between items
    position: 'relative',
  },
  iconCircleWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    zIndex: 1, // Ensure icon and circle are above the line
  },
  circle: {
    ...StyleSheet.absoluteFillObject, // Make circle fill the wrapper
    borderWidth: 2,
    borderRadius: 18,
  },
  activeCircle: {
  },
  inactiveCircle: {
  },
  icon: {
    zIndex: 2, // Ensure icon is on top
  },
  statusLabel: {
    fontSize: 16,
    flex: 1, // Allow text to take remaining space
  },
  activeText: {
  },
  inactiveText: {
  },
  line: {
    position: 'absolute',
    left: 17, // Center the line with the circle
    top: 36, // Start below the circle
    bottom: -25, // Extend line downwards to next item
    width: 2,
    zIndex: 0, // Ensure line is behind circle/icon
  },
  lineActive: {
  },
  lineInactive: {
  },
  detailsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  productItem: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productQuantity: {
    fontSize: 14,
  },
  productPrice: {
    fontSize: 14,
    marginTop: 3,
  },
  noProductsText: {
    fontSize: 15,
    textAlign: 'center',
    paddingVertical: 10,
  },
  couponInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  couponLabel: {
    fontSize: 14,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  discountValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
});