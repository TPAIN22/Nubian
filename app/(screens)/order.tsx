import { View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { useEffect, useState } from "react";
import useOrderStore from "@/store/orderStore";
import { useAuth } from "@clerk/clerk-expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { useTheme } from "@/providers/ThemeProvider";
import { getFinalPrice, getOriginalPrice, hasDiscount, formatPrice as formatPriceUtil } from "@/utils/priceUtils";
import { navigateToProduct } from "@/utils/deepLinks";
import { normalizeProduct } from "@/domain/product/product.normalize";

export default function Order() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { getUserOrders, orders, error, isLoading } = useOrderStore();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

  // جلب الطلبات تلقائيًا عند فتح الصفحة
  useEffect(() => {
    const fetchInitialOrders = async () => {
      try {
        await getUserOrders();
      } catch {
        // يمكن عرض رسالة خطأ إذا لزم الأمر
      }
    };
    fetchInitialOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      await getUserOrders();
    } catch {
      Alert.alert(i18n.t('error'), i18n.t('failedToLoadOrders'));
    }
  };

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
    return date.toLocaleDateString('ar-SD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    const validAmount = typeof amount === 'number' && !isNaN(amount) && isFinite(amount) ? amount : 0;
    return `${validAmount.toLocaleString()} ${i18n.t('currency')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'confirmed':
        return '#27ae60';
      case 'shipped':
        return '#3498db';
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
        return i18n.t('orderStatusPending');
      case 'confirmed':
        return i18n.t('orderStatusConfirmed');
      case 'shipped':
        return i18n.t('orderStatusShipped');
      case 'delivered':
        return i18n.t('orderStatusDelivered');
      case 'cancelled':
        return i18n.t('orderStatusCancelled');
      default:
        return status;
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'pending':
        return i18n.t('paymentStatusPending');
      case 'paid':
        return i18n.t('paymentStatusPaid');
      case 'failed':
        return i18n.t('paymentStatusFailed');
      default:
        return paymentStatus;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return i18n.t('paymentMethodCash');
      case 'card':
        return i18n.t('paymentMethodCard');
      case 'bank':
        return i18n.t('paymentMethodBank');
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
      <View style={[styles.centerContainer, { backgroundColor: Colors.surface }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.text.veryLightGray }]}>{i18n.t('loadingOrders')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors.surface }]}>
        <Text style={[styles.errorText, { color: Colors.error }]}>{i18n.t('errorOccurred')}: {error}</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: Colors.surface }]}>
        <Text style={[styles.emptyText, { color: Colors.text.veryLightGray }]}>{i18n.t('noOrders')}</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors.surface }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={[styles.title, { color: Colors.text.gray }]}>{i18n.t('myOrders')} ({orders.length})</Text>
      
      {orders.map((order: any) => (
        <View key={order._id} style={[styles.orderCard, { backgroundColor: Colors.cardBackground }]}>
          {/* رأس البطاقة */}
          <TouchableOpacity 
            style={[styles.orderHeader, { borderBottomColor: Colors.borderLight }]}
            onPress={() => toggleOrderExpansion(order._id)}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.orderNumber, { color: Colors.text.gray }]}>{order.orderNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
            </View>
            <Text style={[styles.expandText, { color: Colors.primary }]}>
              {expandedOrders[order._id] ? i18n.t('hideDetails') : i18n.t('showDetails')}
            </Text>
          </TouchableOpacity>

          {/* زر تتبع الطلب */}
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'flex-end' }}
            onPress={() => router.push(`/order-tracking/${order._id}`)}
          >
            <Ionicons name="location-outline" size={18} color={Colors.primary} />
            <Text style={{ color: Colors.primary, marginLeft: 4 }}>{i18n.t('trackOrder')}</Text>
          </Pressable>

          {/* معلومات سريعة */}
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: Colors.text.veryLightGray }]}>{i18n.t('date')}:</Text>
              <Text style={[styles.infoValue, { color: Colors.text.gray }]}>{formatDate(order.orderDate)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: Colors.text.veryLightGray }]}>{i18n.t('products')}:</Text>
              <Text style={[styles.infoValue, { color: Colors.text.gray }]}>{getProductsCount(order.productsDetails)} {i18n.t('productUnit')}</Text>
            </View>
          </View>

          {/* Coupon Information */}
          {order.couponDetails && order.couponDetails.code && (
            <View style={[styles.couponSection, { borderTopColor: Colors.borderLight }]}>
              <Text style={[styles.couponLabel, { color: Colors.text.gray }]}>كوبون الخصم:</Text>
              <Text style={[styles.couponCode, { color: Colors.primary }]}>{order.couponDetails.code}</Text>
              {order.discountAmount > 0 && (
                <Text style={[styles.discountAmount, { color: Colors.success }]}>
                  خصم: {formatCurrency(order.discountAmount)}
                </Text>
              )}
            </View>
          )}

          {/* المجموع */}
          <View style={[styles.totalSection, { borderTopColor: Colors.borderLight }]}>
            <Text style={[styles.totalLabel, { color: Colors.text.gray }]}>المجموع الكلي:</Text>
            <Text style={[styles.totalAmount, { color: Colors.success }]}>
              {formatCurrency(order.finalAmount || order.totalAmount)}
            </Text>
            {order.discountAmount > 0 && (
              <View style={styles.originalTotal}>
                <Text style={[styles.originalTotalText, { color: Colors.text.veryLightGray }]}>
                  قبل الخصم: {formatCurrency(order.totalAmount)}
                </Text>
              </View>
            )}
          </View>

          {/* التفاصيل الموسعة */}
          {expandedOrders[order._id] && (
            <View style={[styles.expandedDetails, { borderTopColor: Colors.borderLight }]}>
              {/* تفاصيل الطلب */}
              <View style={styles.orderDetails}>
                <Text style={[styles.sectionTitle, { color: Colors.text.gray }]}>معلومات التوصيل</Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.text.veryLightGray }]}>المدينة:</Text>
                  <Text style={[styles.detailValue, { color: Colors.text.gray }]}>{order.city}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.text.veryLightGray }]}>العنوان:</Text>
                  <Text style={[styles.detailValue, { color: Colors.text.gray }]}>{order.address}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.text.veryLightGray }]}>رقم الهاتف:</Text>
                  <Text style={[styles.detailValue, { color: Colors.text.gray }]}>{order.phoneNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.text.veryLightGray }]}>طريقة الدفع:</Text>
                  <Text style={[styles.detailValue, { color: Colors.text.gray }]}>{getPaymentMethodText(order.paymentMethod)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: Colors.text.veryLightGray }]}>حالة الدفع:</Text>
                  <Text style={[styles.detailValue, { 
                    color: order.paymentStatus === 'paid' ? Colors.success : Colors.warning 
                  }]}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </Text>
                </View>
              </View>

              {/* تفاصيل المنتجات */}
              <View style={styles.productsSection}>
                <Text style={[styles.sectionTitle, { color: Colors.text.gray }]}>المنتجات ({getProductsCount(order.productsDetails)})</Text>
                {order.productsDetails && order.productsDetails.length > 0 ? (
                  order.productsDetails.map((product: any, index: number) => {
                    const productId = product.productId || product._id;
                    return (
                      <Pressable
                        key={product._id || index}
                        style={[styles.productCard, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}
                        onPress={() => {
                          if (productId) {
                            navigateToProduct(productId, {
                              _id: productId,
                              name: product.name || product.productName,
                              price: product.price || 0,
                              discountPrice: product.discountPrice,
                              images: product.images || [],
                            });
                          }
                        }}
                      >
                        <View style={styles.productInfo}>
                          {/* صورة المنتج - إذا كانت متوفرة */}
                          {product.images && Array.isArray(product.images) && product.images[0] && (
                            <Image 
                              source={{ uri: product.images[0] }} 
                              style={[styles.productImage, { backgroundColor: Colors.borderLight }]}
                              contentFit="cover"
                            />
                          )}
                          <View style={styles.productDetails}>
                            <Text style={[styles.productName, { color: Colors.text.gray }]} numberOfLines={2}>
                              {product.name || product.productName || 'منتج غير محدد'}
                            </Text>
                          <View style={styles.productPricing}>
                            {(() => {
                              // Ensure normalization
                              const productObj = normalizeProduct({
                                _id: product.productId || product._id || '',
                                name: product.name || '',
                                merchantPrice: product.merchantPrice || product.price || 0,
                                finalPrice: product.price || 0, // In order.productsDetails, 'price' is the final price charged
                                images: product.images || [],
                                variants: [], // We don't have variants details here, but the price is already captured
                              } as any);
                              
                              const finalPrice = getFinalPrice(productObj);
                              const originalPrice = getOriginalPrice(productObj);
                              const productHasDiscount = hasDiscount(productObj);
                              const quantity = product.quantity || 1;
                              const totalFinalPrice = finalPrice * quantity;
                              
                              return (
                                <>
                                  {productHasDiscount ? (
                                    <>
                                      <Text style={[styles.productPrice, { color: Colors.text.veryLightGray }]}>
                                        <Text style={{ textDecorationLine: 'line-through' }}>
                                          {formatPriceUtil(originalPrice)}
                                        </Text>
                                        {' '}{formatPriceUtil(finalPrice)} × {quantity}
                                      </Text>
                                      <Text style={[styles.productTotal, { color: Colors.success }]}>
                                        = {formatPriceUtil(totalFinalPrice)}
                                      </Text>
                                    </>
                                  ) : (
                                    <>
                                      <Text style={[styles.productPrice, { color: Colors.text.veryLightGray }]}>
                                        {formatPriceUtil(finalPrice)} × {quantity}
                                      </Text>
                                      <Text style={[styles.productTotal, { color: Colors.success }]}>
                                        = {formatPriceUtil(totalFinalPrice)}
                                      </Text>
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </View>
                        </View>
                      </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={[styles.noProductsText, { color: Colors.text.veryLightGray }]}>لا توجد تفاصيل منتجات</Text>
                )}
              </View>

              {/* تاريخ آخر تحديث */}
              <Text style={[styles.updateDate, { color: Colors.text.veryLightGray }]}>
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
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
  },
  orderCard: {
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
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  couponSection: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  couponLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  discountAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    marginBottom: 8,
  },
  originalTotal: {
    marginTop: 4,
  },
  originalTotalText: {
    fontSize: 12,
    textDecorationLine: "line-through",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  expandedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  productsSection: {
    marginTop: 16,
  },
  productCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  productInfo: {
    flexDirection: 'row',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    marginRight: 8,
  },
  productTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  noProductsText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 16,
  },
  updateDate: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
});