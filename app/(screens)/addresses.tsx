/**
 * Saved addresses.
 *
 * Management only — adding and editing both hand off to the map picker, so
 * there is exactly one place in the app where a location gets chosen and no
 * city / sub-city / neighbourhood dropdown anywhere.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { radius, spacing, typography } from '@/theme/tokens';
import { useCheckoutTheme } from '@/components/checkout';
import SavedAddressCard from '@/components/address/SavedAddressCard';
import { ConfirmSheet, type ConfirmSheetRef } from '@/components/ui/ConfirmSheet';
import useAddressStore, { type Address } from '@/store/addressStore';

export default function AddressesScreen() {
  const t = useCheckoutTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    addresses,
    fetchAddresses,
    deleteAddress,
    setDefaultAddress,
    isLoading,
    error,
    clearError,
  } = useAddressStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const confirmRef = useRef<ConfirmSheetRef>(null);

  useEffect(() => {
    fetchAddresses().catch(() => {
      // The store records the message; the inline banner renders it.
    });
  }, [fetchAddresses]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAddresses().catch(() => {});
    setIsRefreshing(false);
  }, [fetchAddresses]);

  const openPicker = useCallback(
    (address?: Address) => {
      clearError();
      // Route groups are transparent in expo-router paths — `/location-picker`,
      // not `/(screens)/location-picker`.
      router.push(
        address
          ? { pathname: '/location-picker', params: { addressId: address._id } }
          : '/location-picker',
      );
    },
    [router, clearError],
  );

  const handleDelete = useCallback(
    (address: Address) => {
      confirmRef.current?.present({
        title: i18n.t('deleteConfirm'),
        message: i18n.t('deleteAddressConfirm'),
        confirmLabel: i18n.t('delete'),
        cancelLabel: i18n.t('cancel'),
        destructive: true,
        onConfirm: () => {
          deleteAddress(address._id);
        },
      });
    },
    [deleteAddress],
  );

  const handleSetDefault = useCallback(
    (address: Address) => {
      setDefaultAddress(address._id);
    },
    [setDefaultAddress],
  );

  const renderItem = useCallback(
    ({ item }: { item: Address }) => (
      <SavedAddressCard
        address={item}
        onEdit={openPicker}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
    ),
    [openPicker, handleDelete, handleSetDefault],
  );

  // Only a full first load blocks; a refresh keeps the list on screen.
  const showFullScreenLoader = isLoading && addresses.length === 0 && !isRefreshing;

  return (
    <View style={[styles.container, { backgroundColor: t.surface }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('back') || 'Back'}
          hitSlop={12}
          style={[styles.backBtn, { backgroundColor: t.surfaceMuted }]}
        >
          <Ionicons name="arrow-back" size={20} color={t.textPrimary} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]} numberOfLines={1}>
            {i18n.t('myAddresses') || 'My addresses'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: t.textTertiary }]} numberOfLines={1}>
            {i18n.t('manageDeliveryAddresses') || 'Manage your delivery locations'}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: t.errorSoft, borderColor: t.error }]}>
          <Ionicons name="alert-circle-outline" size={16} color={t.error} />
          <Text style={[styles.errorText, { color: t.textSecondary }]} numberOfLines={2}>
            {error}
          </Text>
          <Pressable
            onPress={clearError}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={i18n.t('close') || 'Dismiss'}
          >
            <Ionicons name="close" size={16} color={t.error} />
          </Pressable>
        </View>
      ) : null}

      {showFullScreenLoader ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={t.accent} />
          <Text style={[styles.loadingText, { color: t.textTertiary }]}>
            {i18n.t('loadingAddresses') || 'Loading addresses…'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 96 },
            addresses.length === 0 && styles.listEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={t.accent}
              colors={[t.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: t.accentSoft }]}>
                <Ionicons name="map-outline" size={30} color={t.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
                {i18n.t('noAddressesSaved') || 'No saved addresses'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: t.textTertiary }]}>
                {i18n.t('address_emptySubtitle') ||
                  'Drop a pin on the map so we know exactly where to deliver.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Sticky primary action */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: t.surface,
            borderTopColor: t.divider,
            paddingBottom: Math.max(insets.bottom, spacing.base),
          },
        ]}
      >
        <Pressable
          onPress={() => openPicker()}
          accessibilityRole="button"
          accessibilityLabel={i18n.t('addNewAddress') || 'Add a new address'}
          style={styles.addPressable}
        >
          {/* Fill on a plain View with a static style — NativeWind drops the
              function form of Pressable's style prop. */}
          <View style={[styles.addBtn, { backgroundColor: t.cta }]}>
            <Ionicons name="add" size={20} color={t.ctaText} />
            <Text style={[styles.addText, { color: t.ctaText }]}>
              {i18n.t('addNewAddress') || 'Add new address'}
            </Text>
          </View>
        </Pressable>
      </View>

      <ConfirmSheet ref={confirmRef} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { ...typography.title },
  headerSubtitle: { ...typography.caption, marginTop: 2 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: { ...typography.caption, flex: 1 },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { ...typography.caption },

  list: { paddingHorizontal: spacing.base, paddingTop: spacing.xs },
  listEmpty: { flexGrow: 1, justifyContent: 'center' },

  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: { ...typography.subtitle, textAlign: 'center' },
  emptySubtitle: { ...typography.caption, textAlign: 'center', lineHeight: 20 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addPressable: { width: '100%' },
  addBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.button,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  addText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
});
