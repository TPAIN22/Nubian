import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ScrollView } from "react-native";
import { Text } from '@/components/ui/text';
import useAddressStore from '@/store/addressStore';
import useLocationStore from '@/store/locationStore';
import { useAuth } from '@clerk/clerk-expo';
import i18n from "@/utils/i18n";
import { useTheme } from '@/providers/ThemeProvider';
import LocationPicker, { LocationData } from '@/components/LocationPicker';

interface Address {
  _id: string;
  name: string;
  countryId?: string;
  cityId?: string;
  subCityId?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;
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

const AddressForm: FC<AddressFormProps> = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
}) => {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const [form, setForm] = useState<Omit<Address, '_id'>>(initialValues || {
    name: '', city: '', area: '', street: '', building: '', phone: '', notes: '', isDefault: false,
    countryId: undefined, cityId: undefined, subCityId: undefined,
    countryName: undefined, cityName: undefined, subCityName: undefined
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const inputRefs = useRef<Record<string, any>>({});

  // Update form when initialValues change
  useEffect(() => {
    if (visible) {
      setForm(initialValues || {
        name: '', city: '', area: '', street: '', building: '', phone: '', notes: '', isDefault: false,
        countryId: undefined, cityId: undefined, subCityId: undefined,
        countryName: undefined, cityName: undefined, subCityName: undefined
      });
      setErrors({});
    }
  }, [initialValues, visible]);

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    if (!form.name.trim()) newErrors.name = i18n.t('addressForm_recipientName');
    if (!form.subCityId && !form.area.trim()) newErrors.location = i18n.t('addressForm_locationRequired');
    if (!form.street.trim()) newErrors.street = i18n.t('addressForm_street');
    if (!form.building.trim()) newErrors.building = i18n.t('addressForm_building');
    if (!form.phone.trim()) newErrors.phone = i18n.t('addressForm_phone');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (location: LocationData) => {
    setForm(prev => ({
      ...prev,
      ...location,
      area: location.subCityName || prev.area
    }));
    setErrors(prev => ({ ...prev, location: '' }));
    setLocationPickerVisible(false);
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <Modal 
    visible={visible} animationType="slide" onRequestClose={onClose} transparent={true}>
      <View style={[styles.modalOverlay, { backgroundColor: Colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: Colors.cardBackground }]}>
          <View style={[styles.modalHeader, { borderBottomColor: Colors.borderLight }]}>
            <Text style={[styles.modalTitle, { color: Colors.text.gray }]}>
              {initialValues ? i18n.t('addressForm_editTitle') : i18n.t('addressForm_addTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: Colors.surface }]}>
              <Text style={[styles.closeButtonText, { color: Colors.text.veryLightGray }]}>{i18n.t('icon_close')}</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Name Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors.text.gray }]}>
                {i18n.t('addressForm_recipientName')}
                <Text style={[styles.required, { color: Colors.error }]}>*</Text>
              </Text>
              <TextInput
                ref={ref => { inputRefs.current['name'] = ref; }}
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.surface,
                    borderColor: Colors.borderLight,
                    color: Colors.text.gray
                  },
                  errors.name && { borderColor: Colors.error, backgroundColor: Colors.error + '15' }
                ]}
                placeholder={i18n.t('addressForm_recipientNamePlaceholder')}
                placeholderTextColor={Colors.text.veryLightGray}
                value={form.name}
                onChangeText={text => setForm(prev => ({ ...prev, name: text }))}
                returnKeyType="next"
                onSubmitEditing={() => inputRefs.current['phone']?.focus()}
                blurOnSubmit={false}
              />
              {errors.name && <Text style={[styles.errorText, { color: Colors.error }]}>{errors.name}</Text>}
            </View>

            {/* Phone Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors.text.gray }]}>
                {i18n.t('addressForm_phone')}
                <Text style={[styles.required, { color: Colors.error }]}>*</Text>
              </Text>
              <TextInput
                ref={ref => { inputRefs.current['phone'] = ref; }}
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.surface,
                    borderColor: Colors.borderLight,
                    color: Colors.text.gray
                  },
                  errors.phone && { borderColor: Colors.error, backgroundColor: Colors.error + '15' }
                ]}
                placeholder={i18n.t('addressForm_phonePlaceholder')}
                placeholderTextColor={Colors.text.veryLightGray}
                value={form.phone}
                onChangeText={text => setForm(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
                returnKeyType="next"
                onSubmitEditing={() => inputRefs.current['street']?.focus()}
                blurOnSubmit={false}
              />
              {errors.phone && <Text style={[styles.errorText, { color: Colors.error }]}>{errors.phone}</Text>}
            </View>

            {/* Location Picker */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors.text.gray }]}>
                {i18n.t('addressForm_location')}
                <Text style={[styles.required, { color: Colors.error }]}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.surface,
                    borderColor: Colors.borderLight,
                    justifyContent: 'center'
                  },
                  errors.location && { borderColor: Colors.error, backgroundColor: Colors.error + '15' }
                ]}
                onPress={() => setLocationPickerVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.locationText,
                  {
                    color: form.subCityName ? Colors.text.gray : Colors.text.veryLightGray
                  }
                ]}>
                  {form.subCityName
                    ? `${form.countryName || ''} › ${form.cityName || ''} › ${form.subCityName}`
                    : i18n.t('addressForm_selectLocation')
                  }
                </Text>
              </TouchableOpacity>
              {errors.location && <Text style={[styles.errorText, { color: Colors.error }]}>{errors.location}</Text>}
            </View>

            {/* Street Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors.text.gray }]}>
                {i18n.t('addressForm_street')}
                <Text style={[styles.required, { color: Colors.error }]}>*</Text>
              </Text>
              <TextInput
                ref={ref => { inputRefs.current['street'] = ref; }}
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.surface,
                    borderColor: Colors.borderLight,
                    color: Colors.text.gray
                  },
                  errors.street && { borderColor: Colors.error, backgroundColor: Colors.error + '15' }
                ]}
                placeholder={i18n.t('addressForm_streetPlaceholder')}
                placeholderTextColor={Colors.text.veryLightGray}
                value={form.street}
                onChangeText={text => setForm(prev => ({ ...prev, street: text }))}
                returnKeyType="next"
                onSubmitEditing={() => inputRefs.current['building']?.focus()}
              />
              {errors.street && <Text style={[styles.errorText, { color: Colors.error }]}>{errors.street}</Text>}
            </View>

            {/* Building Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors.text.gray }]}>
                {i18n.t('addressForm_building')}
                <Text style={[styles.required, { color: Colors.error }]}>*</Text>
              </Text>
              <TextInput
                ref={ref => { inputRefs.current['building'] = ref; }}
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.surface,
                    borderColor: Colors.borderLight,
                    color: Colors.text.gray
                  },
                  errors.building && { borderColor: Colors.error, backgroundColor: Colors.error + '15' }
                ]}
                placeholder={i18n.t('addressForm_buildingPlaceholder')}
                placeholderTextColor={Colors.text.veryLightGray}
                value={form.building}
                onChangeText={text => setForm(prev => ({ ...prev, building: text }))}
                returnKeyType="next"
                onSubmitEditing={() => inputRefs.current['notes']?.focus()}
                blurOnSubmit={false}
              />
              {errors.building && <Text style={[styles.errorText, { color: Colors.error }]}>{errors.building}</Text>}
            </View>

            {/* Notes Field */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors.text.gray }]}>
                {i18n.t('addressForm_notes')}
              </Text>
              <TextInput
                ref={ref => { inputRefs.current['notes'] = ref; }}
                style={[
                  styles.input,
                  {
                    backgroundColor: Colors.surface,
                    borderColor: Colors.borderLight,
                    color: Colors.text.gray,
                    height: 80,
                    textAlignVertical: 'top'
                  }
                ]}
                placeholder={i18n.t('addressForm_notesPlaceholder')}
                placeholderTextColor={Colors.text.veryLightGray}
                value={form.notes || ''}
                onChangeText={text => setForm(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                blurOnSubmit={true}
              />
            </View>

            {/* Default Checkbox */}
            <TouchableOpacity 
              onPress={() => setForm(prev => ({ ...prev, isDefault: !prev.isDefault }))} 
              style={[styles.checkboxContainer, { backgroundColor: Colors.surface }]}
            >
              <View style={[
                styles.checkboxBox, 
                { borderColor: Colors.primary },
                form.isDefault && { backgroundColor: Colors.primary }
              ]}>
                {form.isDefault && <Text style={styles.checkboxTick}>{i18n.t('icon_tick')}</Text>}
              </View>
              <Text style={[styles.checkboxLabel, { color: Colors.text.gray }]}>{i18n.t('addressForm_makeDefault')}</Text>
            </TouchableOpacity>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { backgroundColor: Colors.surface }]}>
                <Text style={[styles.cancelButtonText, { color: Colors.text.veryLightGray }]}>{i18n.t('addressForm_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={[styles.submitButton, { backgroundColor: Colors.primary }]}>
                <Text style={styles.submitButtonText}>{initialValues ? i18n.t('addressForm_edit') : i18n.t('addressForm_add')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* LocationPicker - ONLY ONE INSTANCE */}
      <LocationPicker
        visible={locationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onSelect={handleLocationSelect}
        initialValues={{
          countryId: form.countryId,
          cityId: form.cityId,
          subCityId: form.subCityId,
          countryName: form.countryName,
          cityName: form.cityName,
          subCityName: form.subCityName
        }}
        language={i18n.language === 'ar' ? 'ar' : 'en'}
      />
    </Modal>
  );
};

export default function AddressesTab() {
  const { theme } = useTheme();
  const Colors = theme.colors;
  const { addresses, fetchAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, isLoading, error, clearError } = useAddressStore();
  const { initialize: initializeLocations } = useLocationStore();
  const { getToken } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [editAddress, setEditAddress] = useState<Address | null>(null);

  useEffect(() => {
    getToken().then(token => fetchAddresses(token));
    initializeLocations();
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
      
      {/* AddressForm - handles its own LocationPicker internally */}
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
    lineHeight: 20,
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
    lineHeight: 20,
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
    lineHeight: 20,
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
  
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  modalContent: {
    borderRadius: 18,
    padding: 16,
    width: '90%',
    maxHeight: '90%',
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    lineHeight: 34,
    textAlign: 'center',
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
    },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  formContainer: {
    flexGrow: 1,
  },
  inputContainer: {
    marginBottom: 16,

  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  required: {
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  locationText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 10,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  errorText: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    padding: 14,
    borderRadius: 10,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  checkboxTick: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
  },
  cancelButtonText: {
    fontSize: 15, 
    fontWeight: 'bold',
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
    },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
    },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 20,
    direction: i18n.language === 'ar' ? 'rtl' : 'ltr',
    },
});