import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, Button, I18nManager, ScrollView } from 'react-native';
import useAddressStore from '@/store/addressStore';
import { useAuth } from '@clerk/clerk-expo';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import i18n from '../components/../../utils/i18n';

interface Address {
  _id: string;
  name: string;
  city: string;
  area: string;
  street: string;
  building: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
}

interface AddressFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: Omit<Address, '_id'>) => void;
  initialValues?: Omit<Address, '_id'> | undefined;
}

const AddressForm: React.FC<AddressFormProps> = ({ visible, onClose, onSubmit, initialValues }) => {
  const [form, setForm] = useState<Omit<Address, '_id'>>(initialValues || {
    name: '', city: '', area: '', street: '', building: '', phone: '', notes: '', isDefault: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const inputRefs = React.useRef<any>({});

  useEffect(() => {
    setForm(initialValues || {
      name: '', city: '', area: '', street: '', building: '', phone: '', notes: '', isDefault: false
    });
    setErrors({});
  }, [initialValues, visible]);

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    ['name','city','area','street','building','phone'].forEach(field => {
      if (!(form as any)[field]) newErrors[field] = i18n.t(
        field === 'name' ? 'addressForm_recipientName' :
        field === 'city' ? 'addressForm_city' :
        field === 'area' ? 'addressForm_area' :
        field === 'street' ? 'addressForm_street' :
        field === 'building' ? 'addressForm_building' :
        field === 'phone' ? 'addressForm_phone' :
        'addressForm_notesRequired');
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(form);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { direction: I18nManager.isRTL ? 'rtl' : 'ltr' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{initialValues ? i18n.t('addressForm_editTitle') : i18n.t('addressForm_addTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>{i18n.t('icon_close')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.formContainer}>
            {(['name','city','area','street','building','phone','notes'] as const).map((field, idx, arr) => (
              <View key={field} style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {field === 'name' ? i18n.t('addressForm_recipientName') :
                    field === 'city' ? i18n.t('addressForm_city') :
                    field === 'area' ? i18n.t('addressForm_area') :
                    field === 'street' ? i18n.t('addressForm_street') :
                    field === 'building' ? i18n.t('addressForm_building') :
                    field === 'phone' ? i18n.t('addressForm_phone') : i18n.t('addressForm_notes')}
                  {field !== 'notes' && <Text style={styles.required}>*</Text>}
                </Text>
                <TextInput
                  ref={ref => { inputRefs.current[field] = ref; }}
                  style={[styles.input, errors[field] && styles.inputError]}
                  placeholder={field === 'name' ? i18n.t('addressForm_recipientNamePlaceholder') :
                    field === 'city' ? i18n.t('addressForm_selectCity') :
                    field === 'area' ? i18n.t('addressForm_areaPlaceholder') :
                    field === 'street' ? i18n.t('addressForm_streetPlaceholder') :
                    field === 'building' ? i18n.t('addressForm_buildingPlaceholder') :
                    field === 'phone' ? i18n.t('addressForm_phonePlaceholder') :
                    i18n.t('addressForm_notesPlaceholder')}
                  value={form[field] as string}
                  onChangeText={text => setForm((f) => ({ ...f, [field]: text }))}
                  keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
                  returnKeyType={idx < arr.length - 1 ? 'next' : 'done'}
                  onSubmitEditing={() => {
                    if (idx < arr.length - 1) {
                      const nextField = arr[idx + 1] as string;
                      if (nextField) inputRefs.current[nextField]?.focus();
                    } else {
                      handleSubmit();
                    }
                  }}
                  blurOnSubmit={idx === arr.length - 1}
                  multiline={field === 'notes'}
                  numberOfLines={field === 'notes' ? 3 : 1}
                />
                {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
              </View>
            ))}
            <TouchableOpacity 
              onPress={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))} 
              style={styles.checkboxContainer}
            >
              <View style={[styles.checkboxBox, form.isDefault && styles.checkboxChecked]}>
                {form.isDefault && <Text style={styles.checkboxTick}>{i18n.t('icon_tick')}</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{i18n.t('addressForm_makeDefault')}</Text>
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>{i18n.t('addressForm_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>{initialValues ? i18n.t('addressForm_edit') : i18n.t('addressForm_add')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function AddressesTab() {
  const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, isLoading, error, clearError } = useAddressStore();
  const { getToken } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  useEffect(() => {
    getToken().then(token => fetchAddresses(token));
  }, []);

  const handleAdd = async (form: Omit<Address, '_id'>) => {
    const token = await getToken();
    await addAddress(form, token);
    setModalVisible(false);
  };
  
  const handleEdit = async (form: Omit<Address, '_id'>) => {
    if (!editAddress) return;
    const token = await getToken();
    await updateAddress(editAddress._id, form, token);
    setEditAddress(null);
    setModalVisible(false);
  };
  
  const handleDelete = async (id: string) => {
    Alert.alert(i18n.t('deleteConfirm'), i18n.t('deleteAddressConfirm'), [
      { text: i18n.t('cancel'), style: 'cancel' },
      { text: i18n.t('delete'), style: 'destructive', onPress: async () => {
        const token = await getToken();
        await deleteAddress(id, token);
      }}
    ]);
  };
  
  const handleSetDefault = async (id: string) => {
    const token = await getToken();
    await setDefaultAddress(id, token);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#30a1a7" />
        <Text style={styles.loadingText}>{i18n.t('loadingAddresses')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { direction: I18nManager.isRTL ? 'rtl' : 'ltr' }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{i18n.t('myAddresses')}</Text>
        <Text style={styles.headerSubtitle}>{i18n.t('manageDeliveryAddresses')}</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
            <Text style={styles.errorCloseText}>{i18n.t('close')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <TouchableOpacity 
        style={styles.addButton} 
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
          <View style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>{i18n.t('default')}</Text>
              </View>
            )}
            
            <View style={styles.addressHeader}>
              <Text style={styles.addressName}>{item.name}</Text>
              <Text style={styles.addressPhone}>{i18n.t('icon_phone')} {item.phone}</Text>
            </View>
            
            <View style={styles.addressDetails}>
              <Text style={styles.addressLocation}>
                {i18n.t('icon_location')} {item.city}، {item.area}، {item.street}، {item.building}
              </Text>
              {item.notes && (
                <Text style={styles.addressNotes}>
                  {i18n.t('icon_note')} {item.notes}
                </Text>
              )}
            </View>
            
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                onPress={() => { setEditAddress(item); setModalVisible(true); }}
                style={styles.actionButton}
              >
                <Text style={styles.actionEdit}>{i18n.t('icon_edit')} {i18n.t('edit')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleDelete(item._id)}
                style={styles.actionButton}
              >
                <Text style={styles.actionDelete}>{i18n.t('icon_delete')} {i18n.t('delete')}</Text>
              </TouchableOpacity>
              
              {!item.isDefault && (
                <TouchableOpacity 
                  onPress={() => handleSetDefault(item._id)}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionDefault}>{i18n.t('icon_star')} {i18n.t('setAsDefault')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>{i18n.t('icon_location')}</Text>
            <Text style={styles.emptyTitle}>{i18n.t('noAddressesSaved')}</Text>
            <Text style={styles.emptySubtitle}>{i18n.t('addYourFirstAddressToFacilitateDelivery')}</Text>
          </View>
        }
      />
      
      <AddressForm
        visible={modalVisible || !!editAddress}
        onClose={() => { setModalVisible(false); setEditAddress(null); }}
        onSubmit={editAddress ? handleEdit : handleAdd}
        initialValues={editAddress || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#30a1a7',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#E0E0E0', // Changed for better contrast
    fontSize: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fdecec',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  errorMessage: {
    color: '#e74c3c',
    fontSize: 16,
    marginBottom: 8,
  },
  errorCloseButton: {
    alignSelf: 'flex-end',
  },
  errorCloseText: {
    color: '#30a1a7',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#30a1a7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: '#fff',
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
  },
  defaultCard: {
    borderColor: '#30a1a7',
    backgroundColor: '#f8f9fa',
    paddingTop: 36,
  },
  defaultBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#30a1a7',
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
    color: '#30a1a7',
    flex: 1,
  },
  addressPhone: {
    fontSize: 16,
    color: '#30a1a7',
    fontWeight: '600',
  },
  addressDetails: {
    marginBottom: 16,
  },
  addressLocation: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
    marginBottom: 8,
  },
  addressNotes: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionEdit: {
    color: '#f0b745',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionDelete: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionDefault: {
    color: '#30a1a7',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#30a1a7',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#888',
    lineHeight: 24,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16, 
    marginHorizontal: 20, 
    width: '90%', 
    minHeight: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18, // Slightly reduced margin
    paddingBottom: 12, // Slightly reduced padding
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  modalTitle: {
    fontSize: 22, // Slightly smaller title
    fontWeight: 'bold',
    color: '#30a1a7',
    flex: 1,
  },
  closeButton: {
    width: 30, // Slightly smaller
    height: 30, // Slightly smaller
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#888',
    fontSize: 18, // Slightly smaller
    fontWeight: 'bold',
  },
  formContainer: {
    maxHeight: '90%',
  },
  inputContainer: {
    marginBottom: 16, // Reduced margin between inputs
  },
  inputLabel: {
    fontSize: 15, // Slightly smaller label font
    fontWeight: '600',
    color: '#30a1a7',
    marginBottom: 6, // Reduced margin
  },
  required: {
    color: '#e74c3c',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#30a1a7',
    borderRadius: 10, // Slightly smaller border radius
    padding: 14, // Slightly reduced padding
    fontSize: 15, // Slightly smaller font size
    backgroundColor: '#f8f9fa',
    color: '#30a1a7',
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdecec',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13, // Slightly smaller error text
    marginTop: 3, // Slightly reduced margin
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18, // Reduced vertical margin
    padding: 14, // Reduced padding
    backgroundColor: '#F8F9FA',
    borderRadius: 10, // Slightly smaller border radius
  },
  checkboxBox: {
    width: 22, // Slightly smaller
    height: 22, // Slightly smaller
    borderWidth: 2,
    borderColor: '#30a1a7',
    borderRadius: 5, // Slightly smaller border radius
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Slightly reduced margin
  },
  checkboxChecked: {
    backgroundColor: '#30a1a7',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 14, // Slightly smaller tick
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 15, // Slightly smaller label font
    color: '#30a1a7',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10, // Slightly reduced gap
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 14, // Slightly reduced padding
    borderRadius: 10, // Slightly smaller border radius
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 15, // Slightly smaller font
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#30a1a7',
    paddingVertical: 14, // Slightly reduced padding
    borderRadius: 10, // Slightly smaller border radius
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15, // Slightly smaller font
    fontWeight: 'bold',
  },
});