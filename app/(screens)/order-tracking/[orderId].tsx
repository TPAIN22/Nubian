import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams } from 'expo-router';
import { View, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { Text } from '@/components/ui/text';
import axiosInstance from "@/services/api/client";
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers/ThemeProvider';
import i18n from "@/utils/i18n";

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
  { key: 'PLACED', label: i18n.t('processing'), icon: 'hourglass-outline' },
  { key: 'VERIFIED', label: i18n.t('paid'), icon: 'checkmark-done-outline' },
  { key: 'SHIPPED', label: i18n.t('shipped'), icon: 'cube-outline' },
  { key: 'DELIVERED', label: i18n.t('delivered'), icon: 'checkmark-circle-outline' },
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

  const lastFetchedOrderId = useRef<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId || lastFetchedOrderId.current === orderId || isFetching.current) return;

      isFetching.current = true;
      lastFetchedOrderId.current = orderId as string;
      setLoading(true);

      try {
        const token = await getToken();
        if (!token) throw new Error(i18n.t('tokenNotFound'));
        const data = await fetchOrder(orderId as string, token);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        setError(err);
        setOrder(null);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    };

    fetchOrderData();
  }, [orderId]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.surface }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.text.veryLightGray }]}>{i18n.t('loadingOrderDetails')}</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.surface }]}>
        <Ionicons name="close-circle-outline" size={50} color={Colors.primary} />
        <Text style={[styles.errorText, { color: Colors.text.gray }]}>{i18n.t('errorFetchingOrder')}</Text>
      </View>
    );
  }

  const currentStatusIndex = (() => {
    let stage = 0;
    if (order.paymentStatus === "VERIFIED" || order.paymentStatus === "paid") stage = 1;
    if (order.status === "shipped") stage = Math.max(stage, 2);
    if (order.status === "delivered") stage = 3;
    return stage;
  })();

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: Colors.surface }]}>
      <View style={[styles.headerCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.title, { color: Colors.text.gray, lineHeight: 34 }]}>{i18n.t('orderTracking')}</Text>
        <Text style={[styles.orderId, { color: Colors.text.veryLightGray, lineHeight: 24 }]}>#{order._id}</Text>
        <Text style={[styles.date, { color: Colors.text.veryLightGray, lineHeight: 24 }]}>
          {i18n.t('orderDate')}: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : i18n.t('notAvailable')}
        </Text>
      </View>

      {/* HORIZONTAL TIMELINE SECTION */}
      <View style={[styles.timelineCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: Colors.text.gray, lineHeight: 34 }]}>{i18n.t('orderStatus')}</Text>
        <View style={styles.timeline}>
          {ORDER_STATUS.map((status, idx) => (
            <View key={status.key} style={styles.timelineItem}>
              {/* Connector Line */}
              {idx < ORDER_STATUS.length - 1 && (
                <View style={[
                  styles.line, 
                  { backgroundColor: idx < currentStatusIndex ? Colors.primary : Colors.borderLight }
                ]} />
              )}

              <View style={styles.iconCircleWrapper}>
                <View style={[
                  styles.circle, 
                  idx <= currentStatusIndex ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : { backgroundColor: Colors.borderLight, borderColor: Colors.borderLight }
                ]} />
                <Ionicons
                  name={status.icon as any}
                  size={16}
                  color={idx <= currentStatusIndex ? Colors.text.white : Colors.text.veryLightGray}
                  style={styles.icon}
                />
              </View>
              <Text style={[
                styles.statusLabel, 
                { color: idx <= currentStatusIndex ? Colors.text.gray : Colors.text.veryLightGray, lineHeight: 24 },
                idx <= currentStatusIndex && { fontWeight: 'bold' }
              ]}>
                {status.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* DETAILS & SUMMARY (Kept same as your original) */}
      <View style={[styles.detailsCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: Colors.text.gray, lineHeight: 34 }]}>{i18n.t('orderDetails')}</Text>
        {order.productsDetails?.map((item: any) => (
          <View key={`${item.productId}-${item.name}`} style={[styles.productItem, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
            <Text style={[styles.productName, { color: Colors.text.gray, lineHeight: 24 }]}>{item.name}</Text>
            <Text style={[styles.productQuantity, { color: Colors.text.veryLightGray, lineHeight: 24 }]}>{i18n.t('quantity')}: {item.quantity}</Text>
            <Text style={[styles.productPrice, { color: Colors.text.veryLightGray, lineHeight: 24 }]}>
              {i18n.t('price')}: {item.price?.toFixed(2)} {i18n.t('currency')}
            </Text>
          </View>
        ))}
      </View>

      {order.orderSummary && (
        <View style={[styles.detailsCard, { backgroundColor: Colors.cardBackground }]}>
          <Text style={[styles.cardTitle, { color: Colors.text.gray, lineHeight: 34 }]}>{i18n.t('orderSummary')}</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: Colors.text.veryLightGray, lineHeight: 24 }]}>{i18n.t('subtotal')}:</Text>
            <Text style={[styles.summaryValue, { color: Colors.text.gray, lineHeight: 24 }]}>{order.orderSummary.subtotal.toFixed(2)} {i18n.t('currency')}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.summaryLabel, { color: Colors.text.gray, fontWeight: 'bold', lineHeight: 24 }]}>{i18n.t('total')}:</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary, fontWeight: 'bold', fontSize: 18, lineHeight: 24 }]}>
              {order.orderSummary.total.toFixed(2)} {i18n.t('currency')}
            </Text>
          </View>
        </View>
      )}
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
  loadingText: { marginTop: 10, fontSize: 16 },
  errorText: { marginTop: 10, fontSize: 16, textAlign: 'center' },
  headerCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, lineHeight: 34 },
  orderId: { fontSize: 16, marginBottom: 5, lineHeight: 24 },
  date: { fontSize: 14, lineHeight: 24 },
  timelineCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeline: {
    flexDirection: 'row', // Horizontal
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 5,
  },
  timelineItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  iconCircleWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  circle: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: 16,
  },
  icon: { zIndex: 2 },
  statusLabel: {
    fontSize: 11,
    textAlign: 'center',
    minHeight: 30,
    lineHeight: 24,
  },
  line: {
    position: 'absolute',
    height: 2,
    top: 16, // Centers line vertically within the 32px circle
    left: '50%', // Starts from center of current circle
    right: '-50%', // Ends at center of next circle
    zIndex: 0,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  productItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  productName: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  productQuantity: { fontSize: 13 },
  productPrice: { fontSize: 13, marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    lineHeight: 24,
  },
  summaryLabel: { fontSize: 14, lineHeight: 24 },
  summaryValue: { fontSize: 14, lineHeight: 24 },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 10,
  },
});