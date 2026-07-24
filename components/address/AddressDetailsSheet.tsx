/**
 * Step two of the address flow: the details a map can never know.
 *
 * The pin is already chosen by the time this opens, and it is shown read-only
 * at the top so the shopper can see what they are describing. Everything here
 * is about getting a courier from the street to the door.
 *
 * Rendered as a Modal rather than a bottom sheet so it can sit above the
 * picker's own map without the two competing for gestures.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  // Plain RN Text on colored fills — the themed <Text> forces a NativeWind
  // className color that overrides inline color and hides the label.
  // eslint-disable-next-line no-restricted-imports
  Text as RNText,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/components/ui/text';
import i18n from '@/utils/i18n';
import { isValidPhone } from '@/utils/phoneValidator';
import { radius, spacing, typography } from '@/theme/tokens';
import { useCheckoutTheme } from '@/components/checkout';
import { ADDRESS_LABELS, labelIcon, labelText } from '@/utils/addressDisplay';
import type { AddressLabel } from '@/services/geo/types';

export interface AddressDetailsValue {
  name: string;
  phone: string;
  whatsapp: string;
  building: string;
  floor: string;
  apartment: string;
  landmark: string;
  notes: string;
  addressLabel: AddressLabel;
  isDefault: boolean;
}

export const EMPTY_DETAILS: AddressDetailsValue = {
  name: '',
  phone: '',
  whatsapp: '',
  building: '',
  floor: '',
  apartment: '',
  landmark: '',
  notes: '',
  addressLabel: 'home',
  isDefault: false,
};

interface Props {
  visible: boolean;
  /** The line resolved from the pin. Read-only context, not an input. */
  addressLine: string;
  /** Shown when the geocoder returned nothing to label the pin with. */
  coordinatesLine?: string;
  initialValues?: AddressDetailsValue;
  isSaving?: boolean;
  isEditing?: boolean;
  onClose: () => void;
  onChangeLocation: () => void;
  onSubmit: (value: AddressDetailsValue) => void;
}

// Backend caps (address.model.js)
const MAX_NAME = 100;
const MAX_PHONE = 30;
const MAX_NOTES = 500;
const MAX_BUILDING = 100;
const MAX_SHORT = 50;
const MAX_LANDMARK = 200;

export default function AddressDetailsSheet({
  visible,
  addressLine,
  coordinatesLine,
  initialValues,
  isSaving = false,
  isEditing = false,
  onClose,
  onChangeLocation,
  onSubmit,
}: Props) {
  const t = useCheckoutTheme();
  const insets = useSafeAreaInsets();
  const writingDirection: 'ltr' | 'rtl' = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [form, setForm] = useState<AddressDetailsValue>(initialValues ?? EMPTY_DETAILS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  useEffect(() => {
    if (visible) {
      setForm(initialValues ?? EMPTY_DETAILS);
      setErrors({});
      setFocused(null);
    }
  }, [initialValues, visible]);

  const setField = <K extends keyof AddressDetailsValue>(
    key: K,
    value: AddressDetailsValue[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  /**
   * Only name and phone are required.
   *
   * Building/floor/apartment are deliberately optional: in much of the region
   * addresses genuinely have none, and the pin plus a landmark is how people
   * actually navigate. Forcing a building number would make shoppers invent one.
   */
  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) {
      next.name = i18n.t('addressForm_recipientNameRequired') || 'Recipient name is required';
    }
    if (!form.phone.trim()) {
      next.phone = i18n.t('addressForm_phoneRequired') || 'Phone number is required';
    } else if (!isValidPhone(form.phone)) {
      next.phone = i18n.t('invalidPhoneNumber') || 'Enter a valid phone number';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (isSaving) return;
    if (validate()) onSubmit(form);
  };

  const saveLabel = useMemo(
    () =>
      isEditing
        ? i18n.t('addressForm_save') || 'Save changes'
        : i18n.t('addressForm_add') || 'Save address',
    [isEditing],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
    >
      <View style={[styles.backdrop, { backgroundColor: t.overlay }]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: t.surface, paddingTop: spacing.sm },
            ]}
          >
            {/* Grabber */}
            <View style={styles.grabberRow}>
              <View style={[styles.grabber, { backgroundColor: t.borderStrong }]} />
            </View>

            <View style={styles.header}>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={i18n.t('close') || 'Close'}
                hitSlop={12}
                style={[styles.headerBtn, { backgroundColor: t.surfaceMuted }]}
              >
                <Ionicons name="close" size={20} color={t.textPrimary} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: t.textPrimary }]} numberOfLines={1}>
                {isEditing
                  ? i18n.t('addressForm_editTitle') || 'Edit address'
                  : i18n.t('addressForm_addTitle') || 'Address details'}
              </Text>
              <View style={styles.headerBtn} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                { paddingBottom: Math.max(insets.bottom, spacing.md) + 96 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Resolved location — context, not an input. */}
              <View
                style={[
                  styles.locationCard,
                  { backgroundColor: t.card, borderColor: t.border },
                ]}
              >
                <View style={[styles.locationIcon, { backgroundColor: t.accentSoft }]}>
                  <Ionicons name="location" size={16} color={t.accent} />
                </View>

                <View style={styles.locationText}>
                  <Text
                    style={[styles.locationLine, { color: t.textPrimary, writingDirection }]}
                    numberOfLines={2}
                  >
                    {addressLine ||
                      coordinatesLine ||
                      i18n.t('address_pinSelected') ||
                      'Pinned location'}
                  </Text>
                  {addressLine && coordinatesLine ? (
                    <Text style={[styles.locationCoords, { color: t.textTertiary }]} numberOfLines={1}>
                      {coordinatesLine}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={onChangeLocation}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t('address_changeLocation') || 'Change location'}
                  hitSlop={8}
                  style={[styles.changeBtn, { borderColor: t.border }]}
                >
                  <Text style={[styles.changeText, { color: t.accent }]}>
                    {i18n.t('address_change') || 'Change'}
                  </Text>
                </Pressable>
              </View>

              {/* Label chooser */}
              <Text
                style={[styles.sectionLabel, { color: t.textSecondary, writingDirection }]}
              >
                {i18n.t('address_labelTitle') || 'Save as'}
              </Text>
              <View style={styles.labelRow}>
                {ADDRESS_LABELS.map((label) => {
                  const selected = form.addressLabel === label;
                  return (
                    <Pressable
                      key={label}
                      onPress={() => setField('addressLabel', label)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected, checked: selected }}
                      accessibilityLabel={labelText(label)}
                      style={[
                        styles.labelChip,
                        {
                          backgroundColor: selected ? t.accentSoft : t.card,
                          borderColor: selected ? t.accent : t.border,
                          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      <Ionicons
                        name={labelIcon(label)}
                        size={15}
                        color={selected ? t.accent : t.textTertiary}
                      />
                      <Text
                        style={[
                          styles.labelChipText,
                          { color: selected ? t.accent : t.textSecondary },
                        ]}
                      >
                        {labelText(label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Field
                label={i18n.t('addressForm_recipientName') || 'Full name'}
                required
                error={errors.name}
                focused={focused === 'name'}
                writingDirection={writingDirection}
              >
                <TextInput
                  ref={(r) => {
                    inputRefs.current.name = r;
                  }}
                  value={form.name}
                  onChangeText={(text) => setField('name', text)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  placeholderTextColor={t.textTertiary}
                  returnKeyType="next"
                  maxLength={MAX_NAME}
                  onSubmitEditing={() => inputRefs.current.phone?.focus()}
                  style={[styles.input, { color: t.textPrimary }]}
                  accessibilityLabel={i18n.t('addressForm_recipientName') || 'Full name'}
                />
              </Field>

              <Field
                label={i18n.t('addressForm_phone') || 'Phone number'}
                required
                error={errors.phone}
                focused={focused === 'phone'}
                writingDirection={writingDirection}
                leading={<Ionicons name="call-outline" size={16} color={t.textTertiary} />}
              >
                <TextInput
                  ref={(r) => {
                    inputRefs.current.phone = r;
                  }}
                  value={form.phone}
                  onChangeText={(text) => setField('phone', text)}
                  onFocus={() => setFocused('phone')}
                  onBlur={() => setFocused(null)}
                  placeholder={i18n.t('addressForm_phonePlaceholder') || '+249 9X XXX XXXX'}
                  placeholderTextColor={t.textTertiary}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={MAX_PHONE}
                  style={[styles.input, { color: t.textPrimary }]}
                  accessibilityLabel={i18n.t('addressForm_phone') || 'Phone number'}
                />
              </Field>

              <Field
                label={i18n.t('addressForm_whatsapp') || 'WhatsApp number'}
                focused={focused === 'whatsapp'}
                writingDirection={writingDirection}
                leading={<Ionicons name="logo-whatsapp" size={16} color={t.textTertiary} />}
              >
                <TextInput
                  ref={(r) => {
                    inputRefs.current.whatsapp = r;
                  }}
                  value={form.whatsapp}
                  onChangeText={(text) => setField('whatsapp', text)}
                  onFocus={() => setFocused('whatsapp')}
                  onBlur={() => setFocused(null)}
                  placeholder={i18n.t('addressForm_whatsappPlaceholder') || '+249 9X XXX XXXX'}
                  placeholderTextColor={t.textTertiary}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={MAX_PHONE}
                  style={[styles.input, { color: t.textPrimary }]}
                />
              </Field>

              <Text
                style={[styles.sectionLabel, { color: t.textSecondary, writingDirection }]}
              >
                {i18n.t('address_detailsTitle') || 'Delivery details'}
              </Text>

              {/* Building / floor / apartment read as one address, so they share a row. */}
              <View style={styles.tripleRow}>
                <View style={styles.tripleWide}>
                  <Field
                    label={i18n.t('address_building') || 'Building'}
                    focused={focused === 'building'}
                    writingDirection={writingDirection}
                    compact
                  >
                    <TextInput
                      ref={(r) => {
                        inputRefs.current.building = r;
                      }}
                      value={form.building}
                      onChangeText={(text) => setField('building', text)}
                      onFocus={() => setFocused('building')}
                      onBlur={() => setFocused(null)}
                      placeholder={i18n.t('address_buildingPlaceholder') || 'No. 12'}
                      placeholderTextColor={t.textTertiary}
                      maxLength={MAX_BUILDING}
                      returnKeyType="next"
                      style={[styles.input, { color: t.textPrimary }]}
                    />
                  </Field>
                </View>

                <View style={styles.tripleNarrow}>
                  <Field
                    label={i18n.t('address_floor') || 'Floor'}
                    focused={focused === 'floor'}
                    writingDirection={writingDirection}
                    compact
                  >
                    <TextInput
                      value={form.floor}
                      onChangeText={(text) => setField('floor', text)}
                      onFocus={() => setFocused('floor')}
                      onBlur={() => setFocused(null)}
                      placeholder="3"
                      placeholderTextColor={t.textTertiary}
                      maxLength={MAX_SHORT}
                      returnKeyType="next"
                      style={[styles.input, { color: t.textPrimary }]}
                    />
                  </Field>
                </View>

                <View style={styles.tripleNarrow}>
                  <Field
                    label={i18n.t('address_apartment') || 'Apt'}
                    focused={focused === 'apartment'}
                    writingDirection={writingDirection}
                    compact
                  >
                    <TextInput
                      value={form.apartment}
                      onChangeText={(text) => setField('apartment', text)}
                      onFocus={() => setFocused('apartment')}
                      onBlur={() => setFocused(null)}
                      placeholder="4B"
                      placeholderTextColor={t.textTertiary}
                      maxLength={MAX_SHORT}
                      returnKeyType="next"
                      style={[styles.input, { color: t.textPrimary }]}
                    />
                  </Field>
                </View>
              </View>

              <Field
                label={i18n.t('address_landmark') || 'Nearby landmark'}
                focused={focused === 'landmark'}
                writingDirection={writingDirection}
                leading={<Ionicons name="flag-outline" size={16} color={t.textTertiary} />}
              >
                <TextInput
                  value={form.landmark}
                  onChangeText={(text) => setField('landmark', text)}
                  onFocus={() => setFocused('landmark')}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    i18n.t('address_landmarkPlaceholder') || 'e.g. opposite the blue mosque'
                  }
                  placeholderTextColor={t.textTertiary}
                  maxLength={MAX_LANDMARK}
                  returnKeyType="next"
                  style={[styles.input, { color: t.textPrimary }]}
                />
              </Field>

              <Field
                label={i18n.t('addressForm_notes') || 'Notes for the courier'}
                focused={focused === 'notes'}
                writingDirection={writingDirection}
                multiline
              >
                <TextInput
                  value={form.notes}
                  onChangeText={(text) => setField('notes', text)}
                  onFocus={() => setFocused('notes')}
                  onBlur={() => setFocused(null)}
                  placeholder={i18n.t('addressForm_notesPlaceholder') || 'Optional'}
                  placeholderTextColor={t.textTertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={MAX_NOTES}
                  style={[styles.input, styles.inputMultiline, { color: t.textPrimary }]}
                />
              </Field>

              <Pressable
                onPress={() => setField('isDefault', !form.isDefault)}
                accessibilityRole="switch"
                accessibilityState={{ checked: form.isDefault }}
                accessibilityLabel={i18n.t('addressForm_makeDefault') || 'Set as default address'}
                style={[
                  styles.toggleRow,
                  { backgroundColor: t.card, borderColor: form.isDefault ? t.accent : t.border },
                ]}
              >
                <Text style={[styles.toggleTitle, { color: t.textPrimary, flex: 1 }]}>
                  {i18n.t('addressForm_makeDefault') || 'Set as default'}
                </Text>
                <View
                  style={[
                    styles.switchTrack,
                    {
                      backgroundColor: form.isDefault ? t.accent : t.surfaceMuted,
                      borderColor: form.isDefault ? t.accent : t.borderStrong,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.switchKnob,
                      {
                        backgroundColor: t.surface,
                        transform: [{ translateX: form.isDefault ? 18 : 2 }],
                      },
                    ]}
                  />
                </View>
              </Pressable>
            </ScrollView>

            {/* Sticky footer CTA */}
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
                onPress={handleSubmit}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaving }}
                accessibilityLabel={saveLabel}
                style={styles.savePressable}
              >
                {/* The fill lives on a plain View with a static style so
                    NativeWind always paints it — see the Pressable note above. */}
                <View
                  style={[
                    styles.saveBtn,
                    { backgroundColor: isSaving ? t.ctaDisabled : t.cta },
                  ]}
                >
                  <RNText
                    style={[
                      styles.saveText,
                      { color: isSaving ? t.ctaDisabledText : t.ctaText },
                    ]}
                  >
                    {isSaving ? i18n.t('saving') || 'Saving…' : saveLabel}
                  </RNText>
                </View>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ---------------- Field shell ---------------- */

function Field({
  label,
  required,
  error,
  focused,
  multiline,
  compact,
  leading,
  writingDirection,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  focused?: boolean;
  multiline?: boolean;
  compact?: boolean;
  leading?: React.ReactNode;
  writingDirection: 'ltr' | 'rtl';
  children: React.ReactNode;
}) {
  const t = useCheckoutTheme();

  return (
    <View style={compact ? styles.fieldWrapCompact : styles.fieldWrap}>
      <Text
        style={[styles.fieldLabel, { color: t.textSecondary, writingDirection }]}
        numberOfLines={1}
      >
        {label}
        {required ? <Text style={{ color: t.error }}> *</Text> : null}
      </Text>

      <View
        style={[
          styles.inputShell,
          multiline && styles.inputShellMultiline,
          {
            backgroundColor: t.card,
            borderColor: error ? t.error : focused ? t.accent : t.border,
            borderWidth: focused || error ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        {children}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={t.error} />
          <Text style={[styles.errorText, { color: t.error }]} numberOfLines={2}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  kav: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },

  grabberRow: { alignItems: 'center', paddingBottom: spacing.sm },
  grabber: { width: 40, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    minHeight: 44,
  },
  headerTitle: { ...typography.title, flex: 1, textAlign: 'center' },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: spacing.base, paddingTop: spacing.xs },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: { flex: 1 },
  locationLine: { ...typography.bodyStrong },
  locationCoords: { ...typography.caption, marginTop: 2 },
  changeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  changeText: { ...typography.captionStrong },

  sectionLabel: {
    ...typography.label,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: 2,
  },

  labelRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  labelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: radius.button,
  },
  labelChipText: { ...typography.captionStrong },

  fieldWrap: { marginBottom: spacing.lg },
  fieldWrapCompact: { marginBottom: 0 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    marginBottom: 7,
    marginLeft: 2,
  },

  tripleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  tripleWide: { flex: 1.4 },
  tripleNarrow: { flex: 1 },

  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  inputShellMultiline: {
    minHeight: 92,
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  leading: { alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 14,
    paddingHorizontal: 0,
  },
  inputMultiline: { minHeight: 76, paddingTop: 10, textAlignVertical: 'top' },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
  },
  toggleTitle: { ...typography.bodyStrong },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  switchKnob: { width: 22, height: 22, borderRadius: 11 },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: { ...typography.caption, flex: 1 },

  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
  savePressable: { width: '100%' },
  saveBtn: {
    width: '100%',
    height: 54,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    fontFamily: Platform.OS === 'web' ? undefined : 'Cairo-Bold',
  },
});
