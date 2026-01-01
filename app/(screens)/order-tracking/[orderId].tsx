import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import axiosInstance from '@/utils/axiosInstans';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons'; // For icons
import { useTheme } from '@/providers/ThemeProvider';

// Types for Order and OrderItem (unchanged, but included for completeness)
interface OrderItem {
  id: string | number;
  name: string;
  quantity: number;
}

interface Order {
  id: string | number;
  status: string;
  createdAt?: string;
  productsDetails?: Array<{
    productId: string | null;
    name: string;
    price: number;
    images: any[];
    category: string;
    description: string;
    stock: number;
    quantity: number;
    totalPrice: number;
    isAvailable?: boolean;
  }>;
}

const ORDER_STATUS = [
  { key: 'pending', label: 'قيد المعالجة', icon: 'hourglass-outline' },
  { key: 'shipped', label: 'تم الشحن', icon: 'cube-outline' },
  { key: 'out_for_delivery', label: 'في الطريق', icon: 'car-outline' },
  { key: 'delivered', label: 'تم التسليم', icon: 'checkmark-circle-outline' },
];

const fetchOrder = async (orderId: string, token: string): Promise<Order> => {
  const res = await axiosInstance.get(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

const { width } = Dimensions.get('window');

export default function OrderTracking() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { orderId } = useLocalSearchParams();
  const { getToken } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error('لم يتم العثور على التوكن');
        const data = await fetchOrder(orderId as string, token);
        setOrder(data);
        setError(null);
      } catch (err: any) {
        setError(err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

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

  // Determine the current status index
  const currentStatusIndex = ORDER_STATUS.findIndex(s => s.key === order.status);

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: Colors.surface }]}>
      <View style={[styles.headerCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.title, { color: Colors.text.gray }]}>تتبع الطلب</Text>
        <Text style={[styles.orderId, { color: Colors.text.veryLightGray }]}>#{order.id}</Text>
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

      <View style={[styles.detailsCard, { backgroundColor: Colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: Colors.text.gray }]}>تفاصيل المنتجات</Text>
        {order.productsDetails && order.productsDetails.length > 0 ? (
          order.productsDetails.map((item: any) => (
            <View key={item.productId} style={[styles.productItem, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
              <Text style={[styles.productName, { color: Colors.text.gray }]}>{item.name}</Text>
              <Text style={[styles.productQuantity, { color: Colors.text.veryLightGray }]}>الكمية: {item.quantity}</Text>
              <Text style={[styles.productPrice, { color: Colors.text.veryLightGray }]}>السعر: {item.price.toFixed(2)} ر.س</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noProductsText, { color: Colors.text.veryLightGray }]}>لا توجد منتجات في هذا الطلب.</Text>
        )}
      </View>
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
});