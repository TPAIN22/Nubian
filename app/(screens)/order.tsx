import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import useOrderStore from "@/store/orderStore";
import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";

export default function Order() {
  const { getUserOrders, orders, error, isLoading } = useOrderStore();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<{ [key: string]: boolean }>({});

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      await getUserOrders(token);
    } catch (err) {
      console.error("Error fetching orders:", err);
      Alert.alert("خطأ", "فشل في تحميل الطلبات");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };


  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} ج.س`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'confirmed':
        return '#27ae60';
      case 'delivered':
        return '#2ecc71';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'delivered':
        return 'تم التسليم';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'pending':
        return 'في الانتظار';
      case 'paid':
        return 'مدفوع';
      case 'failed':
        return 'فشل';
      default:
        return paymentStatus;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'نقدي';
      case 'card':
        return 'بطاقة';
      case 'bank':
        return 'تحويل بنكي';
      default:
        return method;
    }
  };

  // حساب عدد المنتجات من المصفوفة
  const getProductsCount = (products: any[]) => {
    if (!products || !Array.isArray(products)) return 0;
    return products.reduce((total, product) => total + (product.quantity || 1), 0);
  };

  if (isLoading && orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>حدث خطأ: {error}</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>لا توجد طلبات</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>طلباتي ({orders.length})</Text>
      
      {orders.map((order: any) => (
        <View key={order._id} style={styles.orderCard}>
          {/* رأس البطاقة */}
          <TouchableOpacity 
            style={styles.orderHeader}
            onPress={() => toggleOrderExpansion(order._id)}
          >
            <View style={styles.headerContent}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
            </View>
            <Text style={styles.expandText}>
              {expandedOrders[order._id] ? "إخفاء التفاصيل" : "عرض التفاصيل"}
            </Text>
          </TouchableOpacity>

          {/* معلومات سريعة */}
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>التاريخ:</Text>
              <Text style={styles.infoValue}>{formatDate(order.orderDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>المنتجات:</Text>
              <Text style={styles.infoValue}>{getProductsCount(order.productsDetails)} منتج</Text>
            </View>
          </View>

          {/* المجموع */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>المجموع الكلي:</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.totalAmount)}</Text>
          </View>

          {/* التفاصيل الموسعة */}
          {expandedOrders[order._id] && (
            <View style={styles.expandedDetails}>
              {/* تفاصيل الطلب */}
              <View style={styles.orderDetails}>
                <Text style={styles.sectionTitle}>معلومات التوصيل</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>المدينة:</Text>
                  <Text style={styles.detailValue}>{order.city}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>العنوان:</Text>
                  <Text style={styles.detailValue}>{order.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>رقم الهاتف:</Text>
                  <Text style={styles.detailValue}>{order.phoneNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>طريقة الدفع:</Text>
                  <Text style={styles.detailValue}>{getPaymentMethodText(order.paymentMethod)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>حالة الدفع:</Text>
                  <Text style={[styles.detailValue, { 
                    color: order.paymentStatus === 'paid' ? '#27ae60' : '#f39c12' 
                  }]}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </Text>
                </View>
              </View>

              {/* تفاصيل المنتجات */}
              <View style={styles.productsSection}>
                <Text style={styles.sectionTitle}>المنتجات ({getProductsCount(order.productsDetails)})</Text>
                {order.productsDetails && order.productsDetails.length > 0 ? (
                  order.productsDetails.map((product: any, index: number) => (
                    <View key={product._id || index} style={styles.productCard}>
                      <View style={styles.productInfo}>
                        {/* صورة المنتج - إذا كانت متوفرة */}
                        {product.images && Array.isArray(product.images) && product.images[0] && (
                          <Image 
                            source={{ uri: product.images[0] }} 
                            style={styles.productImage}
                            contentFit="cover"
                          />
                        )}
                        <View style={styles.productDetails}>
                          <Text style={styles.productName} numberOfLines={2}>
                            {product.name || product.productName || 'منتج غير محدد'}
                          </Text>
                          <View style={styles.productPricing}>
                            <Text style={styles.productPrice}>
                              {product.price ? formatCurrency(product.price) : 'السعر غير محدد'} × {product.quantity || 1}
                            </Text>
                            <Text style={styles.productTotal}>
                              = {formatCurrency((product.price || 0) * (product.quantity || 1))}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noProductsText}>لا توجد تفاصيل منتجات</Text>
                )}
              </View>

              {/* تاريخ آخر تحديث */}
              <Text style={styles.updateDate}>
                آخر تحديث: {formatDate(order.updatedAt)}
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginTop: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderHeader: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expandText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    textAlign: 'center',
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  productsSection: {
    marginTop: 16,
  },
  productCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  productInfo: {
    flexDirection: 'row',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e9ecef',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#5e6c84',
    marginRight: 8,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  noProductsText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  updateDate: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
});