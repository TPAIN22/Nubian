import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import axiosInstance from '@/utils/axiosInstans';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons'; // For icons

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f0b745" />
        <Text style={styles.loadingText}>جاري تحميل تفاصيل الطلب...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="close-circle-outline" size={50} color="#f0b745" />
        <Text style={styles.errorText}>حدث خطأ أثناء جلب الطلب. الرجاء المحاولة مرة أخرى.</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Ionicons name="information-circle-outline" size={50} color="#f0b745" />
        <Text style={styles.noDataText}>لا يوجد بيانات للطلب لعرضها.</Text>
      </View>
    );
  }

  // Determine the current status index
  const currentStatusIndex = ORDER_STATUS.findIndex(s => s.key === order.status);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>تتبع الطلب</Text>
        <Text style={styles.orderId}>#{order.id}</Text>
        <Text style={styles.date}>تاريخ الطلب: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'غير متوفر'}</Text>
      </View>

      <View style={styles.timelineCard}>
        <Text style={styles.cardTitle}>حالة الطلب</Text>
        <View style={styles.timeline}>
          {ORDER_STATUS.map((status, idx) => (
            <View key={status.key} style={styles.timelineItem}>
              <View style={styles.iconCircleWrapper}>
                <View style={[styles.circle, idx <= currentStatusIndex ? styles.activeCircle : styles.inactiveCircle]} />
                <Ionicons
                  name={status.icon as any} // Type assertion for icon name
                  size={20}
                  color={idx <= currentStatusIndex ? '#FFFFFF' : '#888'}
                  style={styles.icon}
                />
              </View>
              <Text style={[styles.statusLabel, idx <= currentStatusIndex ? styles.activeText : styles.inactiveText]}>
                {status.label}
              </Text>
              {idx < ORDER_STATUS.length - 1 && (
                <View style={[styles.line, idx < currentStatusIndex ? styles.lineActive : styles.lineInactive]} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>تفاصيل المنتجات</Text>
        {order.productsDetails && order.productsDetails.length > 0 ? (
          order.productsDetails.map((item: any) => (
            <View key={item.productId} style={styles.productItem}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productQuantity}>الكمية: {item.quantity}</Text>
              <Text style={styles.productPrice}>السعر: {item.price.toFixed(2)} ر.س</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noProductsText}>لا توجد منتجات في هذا الطلب.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#F5F7FA',// Light background for the whole screen
    flexGrow: 1,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f0b745',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f0b745',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  noDataText: {
    marginTop: 10,
    fontSize: 16,
    color: '#f0b745',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
   
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  orderId: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  date: {
    fontSize: 14,
    color: '#888',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#f0b745', // Primary color
    borderColor: '#f0b745',
  },
  inactiveCircle: {
    backgroundColor: '#E0E0E0',
    borderColor: '#BDBDBD',
  },
  icon: {
    zIndex: 2, // Ensure icon is on top
  },
  statusLabel: {
    fontSize: 16,
    flex: 1, // Allow text to take remaining space
  },
  activeText: {
    color: '#333',
    fontWeight: 'bold',
  },
  inactiveText: {
    color: '#888',
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
    backgroundColor: '#f0b745', // Active line color
  },
  lineInactive: {
    backgroundColor: '#BDBDBD', // Inactive line color
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  
  },
  productItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 5,
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
  },
  productPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  noProductsText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 10,
  },
});