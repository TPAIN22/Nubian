import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TextInput, Button, TouchableOpacity, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import i18n from '../../utils/i18n';

const { height: screenHeight } = Dimensions.get('window');

// RTL is centrally handled via LanguageProvider

export interface Address {
  _id?: string;
  name: string;
  city: string;
  area: string;
  street: string;
  building: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
}

export interface AddressFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: Omit<Address, '_id'>) => void;
  initialValues?: Omit<Address, '_id'> | undefined;
}

const SUDANESE_CITIES = [
  'الخرطوم',
  'أم درمان',
  'بحري',
  'كسلا',
  'القضارف',
  'عطبرة',
  'بورتسودان',
  'مدني',
  'الحصاحيصا',
];

const AddressForm: React.FC<AddressFormProps> = ({ visible, onClose, onSubmit, initialValues }) => {
  const [form, setForm] = useState<Omit<Address, '_id'>>(initialValues || {
    name: '', city: '', area: '', street: '', building: '', phone: '', notes: '', isDefault: false
  });

  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    setForm(initialValues || {
      name: '', city: '', area: '', street: '', building: '', phone: '', notes: '', isDefault: false
    });
  }, [initialValues, visible]);

  const handleSubmit = () => {
    if (!form.name || !form.city || !form.area || !form.street || !form.phone) {
      alert(i18n.t('addressForm_fillRequiredFields'));
      return;
    }
    onSubmit(form);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent statusBarTranslucent>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        extraKeyboardSpace={24}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
            accessibilityLabel="إغلاق النافذة بالضغط خارجها"
          />
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="إغلاق النافذة">
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{initialValues ? i18n.t('addressForm_editTitle') : i18n.t('addressForm_addTitle')}</Text>
            <ScrollView style={{flex: 1}} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formFieldsWrapper}>
                {/* اسم المستلم */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{i18n.t('addressForm_recipientName')} *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={i18n.t('addressForm_recipientNamePlaceholder')}
                    value={form.name}
                    onChangeText={text => setForm((f) => ({ ...f, name: text }))}
                    textAlign="right"
                    accessibilityLabel="أدخل اسم المستلم"
                  />
                </View>
                {/* المدينة */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{i18n.t('addressForm_city')} *</Text>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowCityPicker(true)}
                    activeOpacity={0.7}
                    accessibilityLabel={i18n.t('addressForm_selectCity')}
                  >
                    <Text style={styles.dropdownIcon}>▼</Text>
                    <Text style={[styles.selectText, !form.city && styles.placeholderText]}>
                      {form.city || i18n.t('addressForm_selectCity')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* المنطقة/الحي */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{i18n.t('addressForm_area')} *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={i18n.t('addressForm_areaPlaceholder')}
                    value={form.area}
                    onChangeText={text => setForm((f) => ({ ...f, area: text }))}
                    textAlign="right"
                    accessibilityLabel="أدخل المنطقة أو الحي"
                  />
                </View>
                {/* الشارع */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{i18n.t('addressForm_street')} *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={i18n.t('addressForm_streetPlaceholder')}
                    value={form.street}
                    onChangeText={text => setForm((f) => ({ ...f, street: text }))}
                    textAlign="right"
                    accessibilityLabel="أدخل اسم الشارع"
                  />
                </View>
                {/* المبنى/الشقة */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{i18n.t('addressForm_building')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={i18n.t('addressForm_buildingPlaceholder')}
                    value={form.building}
                    onChangeText={text => setForm((f) => ({ ...f, building: text }))}
                    textAlign="right"
                    accessibilityLabel="أدخل رقم المبنى أو الشقة"
                  />
                </View>
                {/* رقم الهاتف */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{i18n.t('addressForm_phone')} *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={i18n.t('addressForm_phonePlaceholder')}
                    value={form.phone}
                    onChangeText={text => setForm((f) => ({ ...f, phone: text }))}
                    keyboardType="phone-pad"
                    textAlign="right"
                    accessibilityLabel="أدخل رقم الهاتف"
                  />
                </View>
                {/* ملاحظات */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>{i18n.t('addressForm_notes')}</Text>
                  <TextInput
                    style={[styles.input, styles.notesInput]}
                    placeholder={i18n.t('addressForm_notesPlaceholder')}
                    value={form.notes}
                    onChangeText={text => setForm((f) => ({ ...f, notes: text }))}
                    multiline
                    numberOfLines={3}
                    textAlign="right"
                    accessibilityLabel="أدخل ملاحظات إضافية"
                  />
                </View>
                {/* العنوان الافتراضي */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setForm((f) => ({ ...f, isDefault: !f.isDefault }))}
                  activeOpacity={0.7}
                  accessibilityLabel="اجعل هذا العنوان افتراضيًا"
                >
                  <Text style={styles.checkboxLabel}>{i18n.t('addressForm_makeDefault')}</Text>
                  <View style={[styles.checkboxBox, form.isDefault && styles.checkboxChecked]}>
                    {form.isDefault && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
            {/* أزرار الأكشن */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8} accessibilityLabel={i18n.t('addressForm_cancel')}>
                <Text style={styles.cancelButtonText}>{i18n.t('addressForm_cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8} accessibilityLabel={initialValues ? i18n.t('addressForm_editTitle') : i18n.t('addressForm_addTitle')}>
                <Text style={styles.submitButtonText}>
                  {initialValues ? i18n.t('addressForm_edit') : i18n.t('addressForm_add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.pickerModalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowCityPicker(false)}
            accessibilityLabel="إغلاق نافذة اختيار المدينة"
          />
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={() => setShowCityPicker(false)} style={styles.pickerCloseButtonContainer} accessibilityLabel="إغلاق محدد المدينة">
                <Text style={styles.pickerCloseButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>{i18n.t('addressForm_selectCity')}</Text>
            </View>
            <ScrollView style={styles.pickerList}>
              {SUDANESE_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.pickerItem,
                    form.city === city && styles.pickerItemSelected
                  ]}
                  onPress={() => {
                    setForm((f) => ({ ...f, city }));
                    setShowCityPicker(false);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={`${i18n.t('addressForm_selectCity')} ${city}`}
                >
                  <Text style={[
                    styles.pickerItemText,
                    form.city === city && styles.pickerItemTextSelected
                  ]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const COLORS = {
  primary: '#30a1a7',     
    // أزرق مخضر ناعم: للزر الأساسي والعناصر المميزة
  text: '#2c3e50',        
    // لون غامق للنصوص الأساسية
  gray: '#6c757d',        
    // رمادي للنصوص الثانوية والأيقونات
  lightGray: '#f1f3f4',   
    // رمادي فاتح لحقول الإدخال والخلفيات
  border: '#dcdcdc',      
    // لون حدود ناعم
  white: '#ffffff',       
    // أبيض نقي
  danger: '#e74c3c',      
    // أحمر للتنبيهات والأخطاء
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: screenHeight * 0.6,
    maxHeight: screenHeight * 0.9,
    width: '100%',
    alignSelf: 'center',
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: COLORS.gray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 5,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 14,
    color: COLORS.text,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dropdownIcon: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  placeholderText: {
    color: COLORS.gray,
  },
  checkboxContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkMark: {
    color: COLORS.white,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    padding: 14,
    borderRadius: 14,
    marginLeft: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.gray,
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },


  // Picker Modal
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: COLORS.white,
    maxHeight: screenHeight * 0.5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 10,
  },
  pickerHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerCloseButtonContainer: {
    padding: 5,
  },
  pickerCloseButton: {
    fontSize: 20,
    color: COLORS.gray,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  pickerList: {
    paddingHorizontal: 15,
  },
  pickerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  pickerItemText: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'right',
  },
  pickerItemSelected: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
  },
  pickerItemTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  formFieldsWrapper: {
    flexGrow: 1,
    paddingBottom: 8,
  },
});


export default AddressForm;