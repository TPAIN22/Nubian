import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  I18nManager,
  Modal,
  Pressable,
  Alert,
  Animated
} from "react-native";
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from '../utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      Alert.alert("تنبيه", "يرجى اختيار المدينة");
    }
    if (!form.area.trim()) newErrors.area = true;
    
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
    fieldKey: string,
    keyboardType: any = "default",
    error: boolean = false,
    multiline: boolean = false
  ) => {
    const isFocused = focusedField === fieldKey;
    
    return (
      <View style={styles.fieldContainer}>
        <Text style={[
          styles.fieldLabel,
          { color: error ? colors.error : (isFocused ? colors.primary : colors.text.gray) }
        ]}>
          {label}
        </Text>
        <View style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : (isFocused ? colors.primary : colors.borderLight),
            borderWidth: isFocused ? 1.5 : 1,
            height: multiline ? 100 : 52
          }
        ]}>
          <Ionicons 
            name={icon as any} 
            size={20} 
            color={error ? colors.error : (isFocused ? colors.primary : colors.text.veryLightGray)} 
            style={styles.inputIcon} 
          />
          <TextInput
            style={[styles.input, { color: colors.text.gray, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}
            placeholder={placeholder}
            placeholderTextColor={colors.text.veryLightGray}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            multiline={multiline}
            onFocus={() => setFocusedField(fieldKey)}
            onBlur={() => setFocusedField(null)}
            textAlignVertical={multiline ? "top" : "center"}
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Simplified Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={26} color={colors.text.gray} />
        </TouchableOpacity>
        <Heading size="lg" style={{ color: colors.text.gray, fontWeight: '700' }}>
          {initialValues ? i18n.t('addressForm_editTitle') : i18n.t('addressForm_addTitle')}
        </Heading>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recipient Section */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text.gray }]}>معلومات المستلم</Text>
          </View>
          
          {renderInput(
            i18n.t('addressForm_recipientName'),
            form.name,
            (text) => setForm(f => ({ ...f, name: text })),
            i18n.t('addressForm_recipientNamePlaceholder'),
            "person-outline",
            "name",
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
                "phone",
                "phone-pad",
                errors.phone
              )}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              {renderInput(
                "واتساب",
                form.whatsapp,
                (text) => setForm(f => ({ ...f, whatsapp: text })),
                "0912345678",
                "logo-whatsapp",
                "whatsapp",
                "phone-pad",
                errors.whatsapp
              )}
            </View>
          </View>
        </View>

        {/* Address Details Section */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={22} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.text.gray }]}>تفاصيل العنوان</Text>
          </View>

          {/* City Picker */}
          <View style={styles.fieldContainer}>
            <Text style={[
              styles.fieldLabel,
              { color: errors.city ? colors.error : (focusedField === 'city' ? colors.primary : colors.text.gray) }
            ]}>
              {i18n.t('addressForm_city')}
            </Text>
            <TouchableOpacity
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: errors.city ? colors.error : (focusedField === 'city' ? colors.primary : colors.borderLight),
                  borderWidth: focusedField === 'city' ? 1.5 : 1,
                  height: 52
                }
              ]}
              onPress={() => {
                setShowCityPicker(true);
                setFocusedField('city');
              }}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="location-outline" 
                size={20} 
                color={errors.city ? colors.error : (form.city ? colors.primary : colors.text.veryLightGray)} 
                style={styles.inputIcon} 
              />
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
            "area",
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
                "navigate-outline",
                "street"
              )}
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              {renderInput(
                i18n.t('addressForm_building'),
                form.building,
                (text) => setForm(f => ({ ...f, building: text })),
                "رقم المبنى",
                "business-outline",
                "building"
              )}
            </View>
          </View>

          {renderInput(
            i18n.t('addressForm_notes'),
            form.notes || '',
            (text) => setForm(f => ({ ...f, notes: text })),
            i18n.t('addressForm_notesPlaceholder'),
            "chatbubble-outline",
            "notes",
            "default",
            false,
            true
          )}
        </View>

        {/* Default Address Toggle */}
        <TouchableOpacity
          style={[styles.defaultToggle, { backgroundColor: colors.surface }]}
          onPress={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
          activeOpacity={0.7}
        >
          <View style={styles.defaultToggleContent}>
            <View style={styles.defaultToggleLeft}>
              <Ionicons name="star" size={20} color={form.isDefault ? colors.primary : colors.text.veryLightGray} />
              <Text style={[styles.defaultToggleLabel, { color: colors.text.gray }]}>
                {i18n.t('addressForm_makeDefault')}
              </Text>
            </View>
            <View style={[
              styles.switch,
              {
                backgroundColor: form.isDefault ? colors.primary : colors.borderLight,
              }
            ]}>
              <View style={[
                styles.switchThumb,
                {
                  transform: [{ translateX: form.isDefault ? 22 : 2 }]
                }
              ]} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            isLoading && { opacity: 0.6 }
          ]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <Text style={styles.submitButtonText}>جاري الحفظ...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="white" style={{ marginLeft: 8 }} />
              <Text style={styles.submitButtonText}>
                {initialValues ? i18n.t('addressForm_edit') : i18n.t('addressForm_add')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Enhanced City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => {
              setShowCityPicker(false);
              setFocusedField(null);
            }} 
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.borderLight }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.gray }]}>
                {i18n.t('addressForm_selectCity')}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowCityPicker(false);
                  setFocusedField(null);
                }}
              >
                <Ionicons name="close-circle" size={28} color={colors.text.veryLightGray} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SUDANESE_CITIES.map((city, index) => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityItem,
                    form.city === city && { backgroundColor: colors.primary + '08' },
                    index !== SUDANESE_CITIES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }
                  ]}
                  onPress={() => {
                    setForm(f => ({ ...f, city }));
                    setShowCityPicker(false);
                    setFocusedField(null);
                  }}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    styles.cityText,
                    { color: colors.text.gray },
                    form.city === city && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {city}
                  </Text>
                  {form.city === city && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
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
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  row: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  },
  fieldContainer: {
    marginBottom: 16,
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
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
    paddingVertical: 8,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  defaultToggle: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  defaultToggleContent: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultToggleLeft: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: 10,
  },
  defaultToggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButton: {
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  cityItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityText: {
    fontSize: 16,
  }
});

export default AddressForm;