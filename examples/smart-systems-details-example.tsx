import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSmartSystems } from '@/providers/SmartSystemsProvider';
import useItemStore from '@/store/useItemStore';

// مثال على استخدام الأنظمة الذكية في شاشة تفاصيل المنتج
const ProductDetailsWithSmartSystems = () => {
  const { product } = useItemStore();
  const { trackEvent, getRecommendations, sendNotification } = useSmartSystems();
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [userBehavior, setUserBehavior] = useState<any>({});

  // تتبع عرض تفاصيل المنتج
  useEffect(() => {
    if (product) {
      trackEvent('product_details_view', {
        productId: product._id,
        productName: product.name,
        category: product.category,
        price: product.price,
        timestamp: new Date().toISOString()
      });

      // تحميل المنتجات ذات الصلة
      loadRelatedProducts();
    }
  }, [product, trackEvent]);

  // تحميل المنتجات ذات الصلة
  const loadRelatedProducts = useCallback(async () => {
    try {
      const userId = 'current-user-id'; // استبدل بمعرف المستخدم الحقيقي
      const recommendations = getRecommendations(userId, 5);
      setRelatedProducts(recommendations);
    } catch (error) {
      console.error('خطأ في تحميل المنتجات ذات الصلة:', error);
    }
  }, [getRecommendations]);

  // تتبع النقر على الصور
  const handleImageClick = useCallback((imageIndex: number) => {
    trackEvent('product_image_click', {
      productId: product?._id,
      productName: product?.name,
      imageIndex,
      timestamp: new Date().toISOString()
    });
  }, [product, trackEvent]);

  // تتبع تغيير المقاس
  const handleSizeChange = useCallback((size: string) => {
    trackEvent('product_size_change', {
      productId: product?._id,
      productName: product?.name,
      selectedSize: size,
      timestamp: new Date().toISOString()
    });
  }, [product, trackEvent]);

  // تتبع إضافة المنتج للمفضلة
  const handleAddToFavorites = useCallback(() => {
    trackEvent('add_to_favorites', {
      productId: product?._id,
      productName: product?.name,
      category: product?.category,
      price: product?.price,
      timestamp: new Date().toISOString()
    });

    // إرسال إشعار نجاح
    sendNotification('current-user-id', 'تم إضافة المنتج للمفضلة! ❤️', 'success');
  }, [product, trackEvent, sendNotification]);

  // تتبع مشاركة المنتج
  const handleShareProduct = useCallback(() => {
    trackEvent('share_product', {
      productId: product?._id,
      productName: product?.name,
      timestamp: new Date().toISOString()
    });

    // محاكاة المشاركة
    Alert.alert('مشاركة المنتج', 'تم نسخ رابط المنتج للحافظة');
  }, [product, trackEvent]);

  // تتبع عرض الوصف
  const handleDescriptionExpand = useCallback((isExpanded: boolean) => {
    trackEvent('product_description_toggle', {
      productId: product?._id,
      productName: product?.name,
      action: isExpanded ? 'expand' : 'collapse',
      timestamp: new Date().toISOString()
    });
  }, [product, trackEvent]);

  // تتبع النقر على المنتجات ذات الصلة
  const handleRelatedProductClick = useCallback((relatedProduct: any) => {
    trackEvent('related_product_click', {
      originalProductId: product?._id,
      originalProductName: product?.name,
      relatedProductId: relatedProduct._id,
      relatedProductName: relatedProduct.name,
      timestamp: new Date().toISOString()
    });
  }, [product, trackEvent]);

  // تتبع سلوك التمرير
  const handleScroll = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    trackEvent('product_details_scroll', {
      productId: product?._id,
      scrollY: contentOffset.y,
      timestamp: new Date().toISOString()
    });
  }, [product, trackEvent]);

  // تتبع الوقت المستغرق في الصفحة
  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const timeSpent = Date.now() - startTime;
      if (timeSpent > 5000) { // تتبع فقط إذا قضى أكثر من 5 ثوان
        trackEvent('product_details_time_spent', {
          productId: product?._id,
          productName: product?.name,
          timeSpentMs: timeSpent,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [product, trackEvent]);

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>لا يوجد منتج للعرض</Text>
      </View>
    );
  }

  return (
    <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
      <View style={{ padding: 16 }}>
        {/* معلومات المنتج الأساسية */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
          {product.name}
        </Text>
        
        <Text style={{ fontSize: 18, color: '#e98c22', marginBottom: 16 }}>
          SDG {product.price?.toFixed(2)}
        </Text>

        {/* أزرار التفاعل */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#e98c22', 
              padding: 12, 
              borderRadius: 8, 
              marginRight: 8,
              flex: 1
            }}
            onPress={() => {
              trackEvent('add_to_cart_from_details', {
                productId: product._id,
                productName: product.name,
                price: product.price,
                timestamp: new Date().toISOString()
              });
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
              إضافة للسلة
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              backgroundColor: '#ff4757', 
              padding: 12, 
              borderRadius: 8,
              marginRight: 8
            }}
            onPress={handleAddToFavorites}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>❤️</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              backgroundColor: '#3742fa', 
              padding: 12, 
              borderRadius: 8
            }}
            onPress={handleShareProduct}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* الوصف */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            الوصف
          </Text>
          <Text style={{ lineHeight: 24 }}>
            {product.description}
          </Text>
          <TouchableOpacity 
            onPress={() => handleDescriptionExpand(true)}
            style={{ marginTop: 8 }}
          >
            <Text style={{ color: '#e98c22' }}>اقرأ المزيد</Text>
          </TouchableOpacity>
        </View>

        {/* المنتجات ذات الصلة */}
        {relatedProducts.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
              منتجات ذات صلة
            </Text>
            {relatedProducts.map((relatedProduct, index) => (
              <TouchableOpacity
                key={relatedProduct._id || index}
                style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 8 
                }}
                onPress={() => handleRelatedProductClick(relatedProduct)}
              >
                <Text style={{ fontWeight: 'bold' }}>{relatedProduct.name}</Text>
                <Text style={{ color: '#e98c22' }}>
                  SDG {relatedProduct.price?.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* إحصائيات المنتج */}
        <View style={{ marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
            إحصائيات المنتج
          </Text>
          <Text>المخزون: {product.stock || 0}</Text>
          <Text>الفئة: {product.category}</Text>
          {product.sizes && (
            <Text>المقاسات المتاحة: {product.sizes.join(', ')}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default ProductDetailsWithSmartSystems; 