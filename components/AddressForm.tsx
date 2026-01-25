import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from "react-native";
import { Text } from '@/components/ui/text';
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

export default function AddressForm ({
  visible,
  onClose,
  onSubmit,
  initialValues,
}: AddressFormProps) {
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
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
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