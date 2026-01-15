import React, { useEffect, useState } from "react";
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform,
  I18nManager,
  Modal,
  Pressable,
  Alert
} from "react-native";
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from '../utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';

const { width: screenWidth } = Dimensions.get('window');

export interface Address {
  _id?: string;
  name: string;
  city: string;
  area: string;
  street: string;
  building: string;
  phone: string;
  whatsapp: string;
  notes?: string;
  isDefault: boolean;
}

export interface AddressFormProps {
  onClose: () => void;
  onSubmit: (form: Omit<Address, '_id'>) => void;
  initialValues?: Omit<Address, '_id'> | undefined;
  isLoading?: boolean;
}

const SUDANESE_CITIES = [
  'الخرطوم',
  'أم درمان',
  'بحري',
  'بورتسودان',
  'كسلا',
  'القضارف',
  'عطبرة',
  'مدني',
  'الحصاحيصا',
  'الأبيض',
  'كوستي',
  'دنقلا',
];

const AddressForm: React.FC<AddressFormProps> = ({ onClose, onSubmit, initialValues, isLoading = false }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  
  const [form, setForm] = useState<Omit<Address, '_id'>>(initialValues || {
    name: '', city: '', area: '', street: '', building: '', phone: '', whatsapp: '', notes: '', isDefault: false
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    setForm(initialValues || {
      name: '', city: '', area: '', street: '', building: '', phone: '', whatsapp: '', notes: '', isDefault: false
    });
    setErrors({});
  }, [initialValues]);

  const validate = () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.name.trim()) newErrors.name = true;
    if (!form.city) {
      newErrors.city = true;
      // Also show an alert if city is missing as it's a dropdown
      Alert.alert("تنبيه", "يرجى اختيار المدينة");
    }
    if (!form.area.trim()) newErrors.area = true;
    
    // Basic phone validation (allowing 9 or 10 digits)
    const phoneTrimmed = form.phone.trim();
    if (!phoneTrimmed || phoneTrimmed.length < 9) newErrors.phone = true;
    
    const whatsappTrimmed = form.whatsapp.trim();
    if (!whatsappTrimmed || whatsappTrimmed.length < 9) newErrors.whatsapp = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (isLoading) return;
    if (!validate()) {
      return;
    }
    onSubmit(form);
  };

  const renderInput = (
    label: string, 
    value: string, 
    onChange: (text: string) => void, 
    placeholder: string, 
    icon: string, 
    keyboardType: any = "default",
    error: boolean = false,
    multiline: boolean = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: error ? colors.error : colors.text.gray }]}>
        {label}
      </Text>
      <View style={[
        styles.inputWrapper, 
        { 
          backgroundColor: colors.surface, 
          borderColor: error ? colors.error : colors.borderLight,
          height: multiline ? 100 : 55
        }
      ]}>
        <Ionicons name={icon as any} size={20} color={error ? colors.error : colors.primary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}
          placeholder={placeholder}
          placeholderTextColor={colors.text.veryLightGray}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.surface }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text.gray} />
        </TouchableOpacity>
        <Heading size="md" style={{ color: colors.text.gray }}>
          {initialValues ? i18n.t('addressForm_editTitle') : i18n.t('addressForm_addTitle')}
        </Heading>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>معلومات المستلم</Text>
          {renderInput(
            i18n.t('addressForm_recipientName'), 
            form.name, 
            (text) => setForm(f => ({ ...f, name: text })),
            i18n.t('addressForm_recipientNamePlaceholder'),
            "person-outline",
            "default",
            errors.name
          )}
          
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {renderInput(
                i18n.t('addressForm_phone'), 
                form.phone, 
                (text) => setForm(f => ({ ...f, phone: text })),
                "0912345678",
                "call-outline",
                "phone-pad",
                errors.phone
              )}
            </View>
            <View style={{ width: 15 }} />
            <View style={{ flex: 1 }}>
              {renderInput(
                "واتساب", 
                form.whatsapp, 
                (text) => setForm(f => ({ ...f, whatsapp: text })),
                "0912345678",
                "logo-whatsapp",
                "phone-pad",
                errors.whatsapp
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>تفاصيل العنوان</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: errors.city ? colors.error : colors.text.gray }]}>
              {i18n.t('addressForm_city')}
            </Text>
            <TouchableOpacity
              style={[
                styles.inputWrapper, 
                { 
                  backgroundColor: colors.surface, 
                  borderColor: errors.city ? colors.error : colors.borderLight,
                  height: 55
                }
              ]}
              onPress={() => setShowCityPicker(true)}
            >
              <Ionicons name="location-outline" size={20} color={errors.city ? colors.error : colors.primary} style={styles.inputIcon} />
              <Text style={[
                styles.selectText, 
                { color: form.city ? colors.text.gray : colors.text.veryLightGray }
              ]}>
                {form.city || i18n.t('addressForm_selectCity')}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.text.veryLightGray} />
            </TouchableOpacity>
          </View>

          {renderInput(
            i18n.t('addressForm_area'), 
            form.area, 
            (text) => setForm(f => ({ ...f, area: text })),
            i18n.t('addressForm_areaPlaceholder'),
            "map-outline",
            "default",
            errors.area
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              {renderInput(
                i18n.t('addressForm_street'), 
                form.street, 
                (text) => setForm(f => ({ ...f, street: text })),
                i18n.t('addressForm_streetPlaceholder'),
                "navigate-outline"
              )}
            </View>
            <View style={{ width: 15 }} />
            <View style={{ flex: 1 }}>
              {renderInput(
                i18n.t('addressForm_building'), 
                form.building, 
                (text) => setForm(f => ({ ...f, building: text })),
                "رقم المبنى",
                "business-outline"
              )}
            </View>
          </View>

          {renderInput(
            i18n.t('addressForm_notes'), 
            form.notes || '', 
            (text) => setForm(f => ({ ...f, notes: text })),
            i18n.t('addressForm_notesPlaceholder'),
            "chatbubble-ellipses-outline",
            "default",
            false,
            true
          )}
        </View>

        <TouchableOpacity
          style={styles.defaultCheckbox}
          onPress={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkbox, 
            { 
              borderColor: colors.primary,
              backgroundColor: form.isDefault ? colors.primary : 'transparent'
            }
          ]}>
            {form.isDefault && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.text.gray }]}>
            {i18n.t('addressForm_makeDefault')}
          </Text>
        </TouchableOpacity>

              <View style={styles.footer}>
                <TouchableOpacity 
                  style={[
                    styles.submitButton, 
                    { backgroundColor: colors.primary },
                    isLoading && { opacity: 0.7 }
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? i18n.t('loading') || "جاري الحفظ..." : (initialValues ? i18n.t('addressForm_edit') : i18n.t('addressForm_add'))}
                  </Text>
                </TouchableOpacity>
              </View>
      </ScrollView>

      {/* City Picker */}
      <Modal visible={showCityPicker} animationType="fade" transparent>
        <View style={styles.pickerOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCityPicker(false)} />
          <View style={[styles.pickerContent, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.pickerTitle, { color: colors.text.gray }]}>{i18n.t('addressForm_selectCity')}</Text>
            </View>
            <ScrollView>
              {SUDANESE_CITIES.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityItem,
                    { borderBottomColor: colors.borderLight },
                    form.city === city && { backgroundColor: colors.primary + '10' }
                  ]}
                  onPress={() => {
                    setForm(f => ({ ...f, city }));
                    setShowCityPicker(false);
                  }}
                >
                  <Text style={[
                    styles.cityText,
                    { color: colors.text.gray },
                    form.city === city && { color: colors.primary, fontWeight: 'bold' }
                  ]}>
                    {city}
                  </Text>
                  {form.city === city && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  row: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  inputWrapper: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  defaultCheckbox: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    marginTop: 10,
  },
  submitButton: {
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 20,
    paddingVertical: 15,
  },
  pickerHeader: {
    paddingBottom: 15,
    marginBottom: 5,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cityItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  cityText: {
    fontSize: 16,
  }
});

export default AddressForm;
