import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from "@/components/Card";
import axiosInstance from "@/services/api/client";
import { HomeProduct } from '@/api/home.api';
import { navigateToProduct } from '@/utils/deepLinks';

// Card width will be calculated responsively

interface Store {
  _id: string;
  businessName: string;
  businessDescription?: string;
  businessEmail: string;
  businessPhone?: string;
  businessAddress?: string;
  status: string;
  rating?: number;
  verified?: boolean;
  orderCount?: number;
  totalRevenue?: number;
}

export default function StoreScreen() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<HomeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false); // Prevent duplicate calls

  const fetchStoreData = useCallback(async () => {
    if (!id) return;
    
    // Prevent duplicate calls
    if (isFetching) {
      console.log('Store fetch already in progress, skipping...');
      return;
    }
    
    try {
      setIsFetching(true);
      setIsLoading(true);
      setError(null);
      
      // First fetch store details to get the merchant ID
      const storeResponse = await axiosInstance.get(`/merchants/store/${id}`).catch(err => {
        // Don't log 429 errors as warnings repeatedly
        if (err?.response?.status !== 429) {
          console.warn('[Store] Fetch error:', err?.response?.status, err?.response?.data?.message);
        }
        return { data: null };
      });
      
      // Handle store data
      const storeData = storeResponse.data?.data || storeResponse.data;
      if (storeData) {
        setStore(storeData);
      }
      
      // Use the merchant ID from store data (or fallback to route param id)
      const merchantId = storeData?._id || id;
      
      // Log what merchant ID we're using for debugging
      if (__DEV__) {
        console.log(`[Store ${id}] Store found:`, {
          storeId: storeData?._id,
          storeName: storeData?.businessName,
          merchantId: merchantId,
        });
      }
      
      // Now fetch products using the new store products endpoint
      const productsResponse = await axiosInstance.get(`/merchants/store/${merchantId}/products`, {
        params: {
          limit: 50,
          page: 1,
        }
      }).catch(err => {
        // Don't log 429 errors as warnings repeatedly (rate limiting)
        if (err?.response?.status !== 429) {
          console.warn('[Store Products] Fetch error:', err?.response?.status, err?.response?.data?.message);
        }
        return { data: { data: [] } };
      });
      
      // Handle products response with multiple possible structures
      let productsData: HomeProduct[] = [];
      const responseData = productsResponse.data;
      
      // Debug: log the actual response structure to understand API format
      if (__DEV__ && responseData) {
        const dataLength = Array.isArray(responseData?.data) ? responseData.data.length : 'N/A';
        console.log(`[Store ${id}] Products API Response:`, {
          merchantIdUsed: merchantId,
          responseType: typeof responseData,
          isArray: Array.isArray(responseData),
          keys: Object.keys(responseData || {}),
          hasData: !!responseData?.data,
          dataType: typeof responseData?.data,
          dataIsArray: Array.isArray(responseData?.data),
          dataLength: dataLength,
          hasProducts: !!responseData?.products,
          productsIsArray: Array.isArray(responseData?.products),
          hasItems: !!responseData?.items,
          hasMeta: !!responseData?.meta,
          metaTotal: responseData?.meta?.total || 'N/A',
          responsePreview: JSON.stringify(responseData).substring(0, 300),
        });
        
        // If we got 0 products, check if maybe products don't have merchant field set
        if (dataLength === 0) {
          console.warn(`[Store ${id}] ⚠️ No products found for merchant ${merchantId}`);
          console.warn(`[Store ${id}] This could mean:`);
          console.warn(`  1. The store has no products`);
          console.warn(`  2. Products don't have 'merchant' field set to this merchant ID`);
          console.warn(`  3. Products are inactive or deleted`);
        }
      }
      
      // Pattern 1: { data: [...products], meta: {...} } - sendPaginated format
      if (Array.isArray(responseData?.data) && responseData?.meta) {
        productsData = responseData.data;
      }
      // Pattern 2: { data: [...products] } - simple data wrapper
      else if (Array.isArray(responseData?.data)) {
        productsData = responseData.data;
      }
      // Pattern 3: { products: [...] } - legacy format
      else if (Array.isArray(responseData?.products)) {
        productsData = responseData.products;
      }
      // Pattern 4: { items: [...] } - alternative format
      else if (Array.isArray(responseData?.items)) {
        productsData = responseData.items;
      }
      // Pattern 5: Direct array
      else if (Array.isArray(responseData)) {
        productsData = responseData;
      }
      
      // Only log if we found products (to reduce console spam from 0 product stores)
      if (productsData.length > 0) {
        console.log(`[Store ${id}] ✓ Found ${productsData.length} products`);
      } else if (__DEV__) {
        console.log(`[Store ${id}] ⚠ No products found in response`);
      }
      setProducts(productsData);
    } catch (err: any) {
      // Only log non-rate-limit errors
      if (err?.response?.status !== 429) {
        console.error('Error fetching store data:', err?.response?.status, err?.response?.data?.message || err?.message);
        const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load store data';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsFetching(false);
    }
  }, [id, isFetching]);

  useEffect(() => {
    // Only fetch once when component mounts or id changes
    if (id && !store && !isFetching) {
      fetchStoreData();
    }
  }, [id]); // Only depend on id, not fetchStoreData to prevent infinite loops

  const onRefresh = useCallback(() => {
    if (!isFetching && id) {
      setIsRefreshing(true);
      fetchStoreData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isFetching]); // Depend on id and isFetching instead of fetchStoreData to prevent loops

  const handleProductPress = useCallback((product: HomeProduct) => {
    navigateToProduct(product._id, product);
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.surface }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.loadingText, { color: Colors.text.gray }]}>
            Loading store...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !store) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.surface }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} />
          <Text style={[styles.errorText, { color: Colors.text.gray }]}>
            {error || 'Store not found'}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: Colors.primary }]}
            onPress={fetchStoreData}
          >
            <Text style={[styles.retryButtonText, { color: Colors.text.white }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.surface, paddingTop: insets.top + 10 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text.gray} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: Colors.text.gray }]}>
          Store
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Store Banner/Header */}
        <View style={[styles.storeHeader, { backgroundColor: Colors.cardBackground }]}>
          <View style={[styles.storeIconContainer, { backgroundColor: Colors.surface }]}>
            <Ionicons name="storefront" size={64} color={Colors.primary} />
          </View>
          <Text style={[styles.storeName, { color: Colors.text.gray }]}>
            {store.businessName}
          </Text>
          
          {store.businessDescription && (
            <Text style={[styles.storeDescription, { color: Colors.text.veryLightGray }]}>
              {store.businessDescription}
            </Text>
          )}
          
          <View style={styles.storeStats}>
            {store.rating !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color={Colors.warning} />
                <Text style={[styles.statText, { color: Colors.text.gray }]}>
                  {store.rating.toFixed(1)}
                </Text>
              </View>
            )}
            {store.orderCount !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="bag" size={16} color={Colors.text.veryLightGray} />
                <Text style={[styles.statText, { color: Colors.text.veryLightGray }]}>
                  {store.orderCount} orders
                </Text>
              </View>
            )}
          </View>
          
          {store.status === 'APPROVED' && (
            <View style={[styles.verifiedBadge, { backgroundColor: Colors.success }]}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.text.white} />
              <Text style={[styles.verifiedText, { color: Colors.text.white }]}>
                Verified Store
              </Text>
            </View>
          )}
        </View>

        {/* Store Info */}
        {(store.businessAddress || store.businessPhone || store.businessEmail) && (
          <View style={[styles.storeInfo, { backgroundColor: Colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: Colors.text.gray }]}>
              Store Information
            </Text>
            {store.businessAddress && (
              <View style={styles.infoItem}>
                <Ionicons name="location-outline" size={20} color={Colors.text.veryLightGray} />
                <Text style={[styles.infoText, { color: Colors.text.veryLightGray }]}>
                  {store.businessAddress}
                </Text>
              </View>
            )}
            {store.businessPhone && (
              <View style={styles.infoItem}>
                <Ionicons name="call-outline" size={20} color={Colors.text.veryLightGray} />
                <Text style={[styles.infoText, { color: Colors.text.veryLightGray }]}>
                  {store.businessPhone}
                </Text>
              </View>
            )}
            {store.businessEmail && (
              <View style={styles.infoItem}>
                <Ionicons name="mail-outline" size={20} color={Colors.text.veryLightGray} />
                <Text style={[styles.infoText, { color: Colors.text.veryLightGray }]}>
                  {store.businessEmail}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.productsHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.text.gray }]}>
              Products ({products.length})
            </Text>
          </View>
          
          {products.length === 0 && !isLoading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={Colors.text.veryLightGray} />
              <Text style={[styles.emptyText, { color: Colors.text.veryLightGray }]}>
                No products available
              </Text>
            </View>
          ) : products.length > 0 ? (
            <FlatList
              data={products}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.productsGrid}
              columnWrapperStyle={styles.productsRow}
              renderItem={({ item }) => (
                <View style={{ flex: 1, marginBottom: 16, marginHorizontal: 8 }}>
                  <Card
                    item={item}
                    handleSheetChanges={() => {}}
                    handlePresentModalPress={() => handleProductPress(item)}
                  />
                </View>
              )}
              keyExtractor={(item) => item._id}
            />
          ) : (
            <View style={styles.loadingProductsContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={[styles.loadingProductsText, { color: Colors.text.veryLightGray }]}>
                Loading products...
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  storeHeader: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  storeIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  storeDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  storeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  storeInfo: {
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  productsSection: {
    paddingHorizontal: 16,
  },
  productsHeader: {
    marginBottom: 16,
  },
  productsGrid: {
    paddingBottom: 16,
  },
  productsRow: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadingProductsContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingProductsText: {
    marginTop: 16,
    fontSize: 14,
  },
});
