import { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text } from '@/components/ui/text';
import useAddressStore from '@/store/addressStore';
import type { Address } from '@/store/addressStore';
import useLocationStore from '@/store/locationStore';
import i18n from "@/utils/i18n";
import { useTheme } from '@/providers/ThemeProvider';
import AddressForm from '@/components/AddressForm';

export default function AddressesTab() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, isLoading, error, clearError } = useAddressStore();
  const { initialize: initializeLocations } = useLocationStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
    initializeLocations();
  }, [fetchAddresses, initializeLocations]);

  const handleAdd = async (form: Omit<Address, '_id'>) => {
    await addAddress(form);
    setModalVisible(false);
  };

  const handleEdit = async (form: Omit<Address, '_id'>) => {
    if (!editAddress) return;
    await updateAddress(editAddress._id, form);
    setEditAddress(null);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(i18n.t('deleteConfirm'), i18n.t('deleteAddressConfirm'), [
      { text: i18n.t('cancel'), style: 'cancel' },
      { text: i18n.t('delete'), style: 'destructive', onPress: async () => {
        await deleteAddress(id);
      }}
    ]);
  };

  const handleSetDefault = async (id: string) => {
    await setDefaultAddress(id);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors.surface }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: Colors.text.veryLightGray }]}>{i18n.t('loadingAddresses')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface }]}>
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <Text style={styles.headerTitle}>{i18n.t('myAddresses')}</Text>
        <Text style={[styles.headerSubtitle, { color: Colors.text.white + 'CC' }]}>{i18n.t('manageDeliveryAddresses')}</Text>
      </View>

      {error ? (
        <View style={[styles.errorContainer, { backgroundColor: Colors.error + '20', borderLeftColor: Colors.error }]}>
          <Text style={[styles.errorMessage, { color: Colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
            <Text style={[styles.errorCloseText, { color: Colors.primary }]}>{i18n.t('close')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: Colors.primary }]}
        onPress={() => { setEditAddress(null); setModalVisible(true); }}
      >
        <Text style={styles.addButtonIcon}>{i18n.t('icon_add')}</Text>
        <Text style={styles.addButtonText}>{i18n.t('addNewAddress')}</Text>
      </TouchableOpacity>

      <FlatList
        data={addresses}
        keyExtractor={(item: Address) => item._id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: Address }) => (
          <View style={[
            styles.addressCard,
            { backgroundColor: Colors.cardBackground },
            item.isDefault && { borderColor: Colors.primary, backgroundColor: Colors.surface }
          ]}>
            {item.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: Colors.primary }]}>
                <Text style={styles.defaultBadgeText}>{i18n.t('default')}</Text>
              </View>
            )}

            <View style={styles.addressHeader}>
              <Text style={[styles.addressName, { color: Colors.primary }]}>{item.name}</Text>
              <Text style={[styles.addressPhone, { color: Colors.primary }]}>{i18n.t('icon_phone')} {item.phone}</Text>
            </View>

            <View style={styles.addressDetails}>
              <Text style={[styles.addressLocation, { color: Colors.text.veryLightGray }]}>
                {i18n.t('icon_location')} {item.subCityName || item.area}، {item.street}، {item.building}
              </Text>
              {item.notes && (
                <Text style={[styles.addressNotes, { color: Colors.text.veryLightGray }]}>
                  {i18n.t('icon_note')} {item.notes}
                </Text>
              )}
            </View>

            <View style={[styles.actionsRow, { borderTopColor: Colors.borderLight }]}>
              <TouchableOpacity
                onPress={() => { setEditAddress(item); setModalVisible(true); }}
                style={styles.actionButton}
              >
                <Text style={[styles.actionEdit, { color: Colors.primary }]}>{i18n.t('icon_edit')} {i18n.t('edit')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item._id)}
                style={styles.actionButton}
              >
                <Text style={[styles.actionDelete, { color: Colors.error }]}>{i18n.t('icon_delete')} {i18n.t('delete')}</Text>
              </TouchableOpacity>

              {!item.isDefault && (
                <TouchableOpacity
                  onPress={() => handleSetDefault(item._id)}
                  style={styles.actionButton}
                >
                  <Text style={[styles.actionDefault, { color: Colors.primary }]}>{i18n.t('icon_star')} {i18n.t('setAsDefault')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyIcon, { color: Colors.text.veryLightGray }]}>{i18n.t('icon_location')}</Text>
            <Text style={[styles.emptyTitle, { color: Colors.primary }]}>{i18n.t('noAddressesSaved')}</Text>
            <Text style={[styles.emptySubtitle, { color: Colors.text.veryLightGray }]}>{i18n.t('addYourFirstAddressToFacilitateDelivery')}</Text>
          </View>
        }
      />

      <AddressForm
        visible={modalVisible || !!editAddress}
        onClose={() => { setModalVisible(false); setEditAddress(null); }}
        onSubmit={(editAddress ? handleEdit : handleAdd) as (form: any) => void}
        initialValues={editAddress ? (editAddress as any) : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 38,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 20,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
  },
  errorMessage: {
    fontSize: 16,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorCloseButton: {
    alignSelf: 'flex-end',
  },
  errorCloseText: {
    fontWeight: 'bold',
    lineHeight: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 12,
    margin: 16,
    marginTop: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
    lineHeight: 38,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  addressCard: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    position: 'relative',
    borderWidth: 1,
  },
  defaultBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressName: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  addressPhone: {
    fontSize: 16,
    fontWeight: '600',
  },
  addressDetails: {
    marginBottom: 16,
  },
  addressLocation: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  addressNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionEdit: {
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 20,
  },
  actionDelete: {
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 20,
  },
  actionDefault: {
    fontWeight: 'bold',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    lineHeight: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 28,
  },
  emptySubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
  },
});
