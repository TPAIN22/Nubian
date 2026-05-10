import { useEffect, useMemo, useRef, useState } from "react";
import {
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import LocationPicker, { LocationData } from "@/components/LocationPicker";
import { isValidPhone } from "@/utils/phoneValidator";
import {
  radius,
  spacing,
  typography,
  useCheckoutTheme,
} from "@/components/checkout";
import Colors from "@/locales/brandColors";

/**
 * Mirrors the backend `Address` model in `apps/backend/src/models/address.model.js`.
 * Field set is the intersection of what the controller's `ALLOWED_FIELDS`
 * accepts on write and what `getAddresses` returns on read.
 *
 * Notes:
 * - `city` exists on the legacy schema but is NOT in ALLOWED_FIELDS, so it
 *   never persists from the client. We read it for older records but never set it.
 * - There is no `nickname` field server-side — don't store one client-side
 *   either, since it would silently disappear on save.
 */
interface Address {
  _id: string;
  name: string;
  countryId?: string;
  cityId?: string;
  subCityId?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;
  city?: string;
  area: string;
  street: string;
  building: string;
  phone: string;
  whatsapp?: string;
  notes?: string;
  isDefault: boolean;
}

interface AddressFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (form: Omit<Address, "_id">) => void;
  initialValues?: Omit<Address, "_id"> | undefined;
}

const EMPTY: Omit<Address, "_id"> = {
  name: "",
  area: "",
  street: "",
  building: "",
  phone: "",
  whatsapp: "",
  notes: "",
  isDefault: false,
  countryId: undefined,
  cityId: undefined,
  subCityId: undefined,
  countryName: undefined,
  cityName: undefined,
  subCityName: undefined,
};

// Backend caps (address.model.js)
const MAX_NAME = 100;
const MAX_PHONE = 30;
const MAX_NOTES = 500;
const MAX_FIELD = 200;

export default function AddressForm({
  visible,
  onClose,
  onSubmit,
  initialValues,
}: AddressFormProps) {
  const t = useCheckoutTheme();
  const insets = useSafeAreaInsets();
  const writingDirection: "ltr" | "rtl" =
    i18n.language === "ar" ? "rtl" : "ltr";

  const [form, setForm] = useState<Omit<Address, "_id">>(
    initialValues || EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState<string | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const inputRefs = useRef<Record<string, TextInput | null>>({});

  useEffect(() => {
    if (visible) {
      setForm(initialValues || EMPTY);
      setErrors({});
      setFocused(null);
    }
  }, [initialValues, visible]);

  const isEditing = !!initialValues;

  const setField = <K extends keyof Omit<Address, "_id">>(
    key: K,
    value: Omit<Address, "_id">[K],
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim())
      next.name =
        i18n.t("addressForm_recipientName") || "Recipient name is required";
    if (!form.subCityId && !form.area.trim())
      next.location =
        i18n.t("addressForm_locationRequired") || "Select a delivery location";
    if (!form.street.trim())
      next.street = i18n.t("addressForm_street") || "Street is required";
    if (!form.building.trim())
      next.building = i18n.t("addressForm_building") || "Building is required";
    if (!form.phone.trim()) {
      next.phone = i18n.t("addressForm_phone") || "Phone is required";
    } else if (!isValidPhone(form.phone)) {
      next.phone =
        i18n.t("invalidPhoneNumber") || "Enter a valid phone number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLocationSelect = (location: LocationData) => {
    setForm(prev => ({
      ...prev,
      ...location,
      area: location.subCityName || prev.area,
    }));
    setErrors(prev => {
      const next = { ...prev };
      delete next.location;
      return next;
    });
    setLocationOpen(false);
  };

  const handleSubmit = () => {
    if (validate()) onSubmit(form);
  };

  const locationLabel = useMemo(() => {
    if (form.subCityName)
      return [form.cityName, form.subCityName].filter(Boolean).join(" · ");
    return null;
  }, [form.cityName, form.subCityName]);

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
    >
      <View
        style={[styles.backdrop, { backgroundColor: t.overlay }]}
      >
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: t.surface,
                paddingTop: insets.top + spacing.sm,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={i18n.t("close") || "Close"}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: t.surfaceMuted },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={t.textPrimary}
                />
              </Pressable>
              <Text
                style={[styles.headerTitle, { color: t.textPrimary }]}
                numberOfLines={1}
              >
                {isEditing
                  ? i18n.t("addressForm_editTitle") || "Edit address"
                  : i18n.t("addressForm_addTitle") || "New address"}
              </Text>
              <View style={styles.headerBtn} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.content,
                {
                  paddingBottom:
                    Math.max(insets.bottom, spacing.md) + 80,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Recipient details */}
              <Text
                style={[styles.sectionLabel, { color: t.textTertiary }]}
              >
                {(
                  i18n.t("addressForm_contactSection") || "Recipient"
                ).toUpperCase()}
              </Text>

              <Field
                label={
                  i18n.t("addressForm_recipientName") || "Recipient name"
                }
                required
                error={errors.name}
                focused={focused === "name"}
                writingDirection={writingDirection}
              >
                <TextInput
                  ref={r => {
                    inputRefs.current.name = r;
                  }}
                  value={form.name}
                  onChangeText={text => setField("name", text)}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    i18n.t("addressForm_recipientNamePlaceholder") ||
                    "Full name"
                  }
                  placeholderTextColor={t.textTertiary}
                  returnKeyType="next"
                  maxLength={MAX_NAME}
                  onSubmitEditing={() =>
                    inputRefs.current.phone?.focus()
                  }
                  style={[styles.input, { color: t.textPrimary }]}
                  accessibilityLabel={
                    i18n.t("addressForm_recipientName") || "Recipient name"
                  }
                />
              </Field>

              <Field
                label={i18n.t("addressForm_phone") || "Phone number"}
                required
                error={errors.phone}
                focused={focused === "phone"}
                hint={
                  !errors.phone
                    ? i18n.t("addressForm_phoneHint") ||
                      "Include country code if dialling from abroad"
                    : undefined
                }
                writingDirection={writingDirection}
                leading={
                  <Ionicons
                    name="call-outline"
                    size={16}
                    color={t.textTertiary}
                  />
                }
              >
                <TextInput
                  ref={r => {
                    inputRefs.current.phone = r;
                  }}
                  value={form.phone}
                  onChangeText={text => setField("phone", text)}
                  onFocus={() => setFocused("phone")}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    i18n.t("addressForm_phonePlaceholder") ||
                    "+249 9X XXX XXXX"
                  }
                  placeholderTextColor={t.textTertiary}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={MAX_PHONE}
                  style={[styles.input, { color: t.textPrimary }]}
                  accessibilityLabel={
                    i18n.t("addressForm_phone") || "Phone number"
                  }
                />
              </Field>

              <Field
                label={i18n.t("addressForm_whatsapp") || "WhatsApp (optional)"}
                focused={focused === "whatsapp"}
                writingDirection={writingDirection}
                hint={
                  i18n.t("addressForm_whatsappHint") ||
                  "We'll use this for delivery updates if different from your phone"
                }
                leading={
                  <Ionicons
                    name="logo-whatsapp"
                    size={16}
                    color={t.textTertiary}
                  />
                }
              >
                <TextInput
                  ref={r => {
                    inputRefs.current.whatsapp = r;
                  }}
                  value={form.whatsapp || ""}
                  onChangeText={text => setField("whatsapp", text)}
                  onFocus={() => setFocused("whatsapp")}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    i18n.t("addressForm_whatsappPlaceholder") ||
                    "+249 9X XXX XXXX"
                  }
                  placeholderTextColor={t.textTertiary}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                  maxLength={MAX_PHONE}
                  style={[styles.input, { color: t.textPrimary }]}
                />
              </Field>

              {/* Location */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: t.textTertiary, marginTop: spacing.lg },
                ]}
              >
                {(
                  i18n.t("addressForm_locationSection") || "Delivery location"
                ).toUpperCase()}
              </Text>

              <Pressable
                onPress={() => setLocationOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={
                  i18n.t("addressForm_location") || "Select location"
                }
                style={({ pressed }) => [
                  styles.fieldShell,
                  {
                    backgroundColor: t.card,
                    borderColor: errors.location
                      ? t.error
                      : t.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={styles.locationRow}>
                  <View
                    style={[
                      styles.locationIcon,
                      { backgroundColor: t.accentSoft },
                    ]}
                  >
                    <Ionicons
                      name="map-outline"
                      size={16}
                      color={t.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.fieldLabel,
                        { color: t.textTertiary },
                      ]}
                    >
                      {i18n.t("addressForm_location") || "Location"}
                      <Text style={{ color: t.error }}> *</Text>
                    </Text>
                    <Text
                      style={[
                        locationLabel
                          ? styles.locationText
                          : styles.locationPlaceholder,
                        {
                          color: locationLabel
                            ? t.textPrimary
                            : t.textTertiary,
                          writingDirection,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {locationLabel ||
                        i18n.t("addressForm_selectLocation") ||
                        "Select country, city, area"}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      I18nManager.isRTL ? "chevron-back" : "chevron-forward"
                    }
                    size={18}
                    color={t.textTertiary}
                  />
                </View>
              </Pressable>
              {errors.location ? (
                <ErrorLine
                  message={errors.location}
                  color={t.error}
                />
              ) : null}

              <Field
                label={i18n.t("addressForm_street") || "Street"}
                required
                error={errors.street}
                focused={focused === "street"}
                writingDirection={writingDirection}
              >
                <TextInput
                  ref={r => {
                    inputRefs.current.street = r;
                  }}
                  value={form.street}
                  onChangeText={text => setField("street", text)}
                  onFocus={() => setFocused("street")}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    i18n.t("addressForm_streetPlaceholder") ||
                    "Street name"
                  }
                  placeholderTextColor={t.textTertiary}
                  returnKeyType="next"
                  maxLength={MAX_FIELD}
                  onSubmitEditing={() =>
                    inputRefs.current.building?.focus()
                  }
                  style={[styles.input, { color: t.textPrimary }]}
                />
              </Field>

              <Field
                label={
                  i18n.t("addressForm_building") || "Building / Apartment"
                }
                required
                error={errors.building}
                hint={
                  !errors.building
                    ? i18n.t("addressForm_buildingHelper") ||
                      "Building number, floor, or apartment"
                    : undefined
                }
                focused={focused === "building"}
                writingDirection={writingDirection}
              >
                <TextInput
                  ref={r => {
                    inputRefs.current.building = r;
                  }}
                  value={form.building}
                  onChangeText={text => setField("building", text)}
                  onFocus={() => setFocused("building")}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    i18n.t("addressForm_buildingPlaceholder") ||
                    "e.g. Building 12, Apt 4"
                  }
                  placeholderTextColor={t.textTertiary}
                  returnKeyType="next"
                  maxLength={MAX_FIELD}
                  onSubmitEditing={() =>
                    inputRefs.current.notes?.focus()
                  }
                  style={[styles.input, { color: t.textPrimary }]}
                />
              </Field>

              <Field
                label={i18n.t("addressForm_notes") || "Notes"}
                hint={
                  i18n.t("addressForm_notesHint") ||
                  "Landmarks, gate codes, delivery preferences"
                }
                focused={focused === "notes"}
                writingDirection={writingDirection}
                multiline
              >
                <TextInput
                  ref={r => {
                    inputRefs.current.notes = r;
                  }}
                  value={form.notes || ""}
                  onChangeText={text => setField("notes", text)}
                  onFocus={() => setFocused("notes")}
                  onBlur={() => setFocused(null)}
                  placeholder={
                    i18n.t("addressForm_notesPlaceholder") ||
                    "Optional"
                  }
                  placeholderTextColor={t.textTertiary}
                  multiline
                  numberOfLines={3}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  blurOnSubmit
                  maxLength={MAX_NOTES}
                  style={[
                    styles.input,
                    styles.inputMultiline,
                    { color: t.textPrimary },
                  ]}
                />
              </Field>

              {/* Default toggle */}
              <Pressable
                onPress={() =>
                  setField("isDefault", !form.isDefault)
                }
                accessibilityRole="switch"
                accessibilityState={{ checked: form.isDefault }}
                accessibilityLabel={
                  i18n.t("addressForm_makeDefault") ||
                  "Set as default address"
                }
                style={({ pressed }) => [
                  styles.toggleRow,
                  {
                    backgroundColor: t.card,
                    borderColor: form.isDefault ? t.accent : t.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.toggleTitle,
                      { color: t.textPrimary },
                    ]}
                  >
                    {i18n.t("addressForm_makeDefault") ||
                      "Set as default"}
                  </Text>
                  <Text
                    style={[
                      styles.toggleDesc,
                      { color: t.textTertiary },
                    ]}
                    numberOfLines={2}
                  >
                    {i18n.t("addressForm_makeDefaultHint") ||
                      "Use this address by default at checkout"}
                  </Text>
                </View>
                <View
                  style={[
                    styles.switchTrack,
                    {
                      backgroundColor: form.isDefault
                        ? t.accent
                        : t.surfaceMuted,
                      borderColor: form.isDefault
                        ? t.accent
                        : t.borderStrong,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.switchKnob,
                      {
                        backgroundColor: t.surface,
                        transform: [
                          {
                            translateX: form.isDefault
                              ? 18
                              : 2,
                          },
                        ],
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
                  paddingBottom: Math.max(insets.bottom, spacing.md),
                },
              ]}
            >
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={
                  i18n.t("addressForm_cancel") || "Cancel"
                }
                style={[styles.cancelBtn,  { backgroundColor: "red" }]}
              >
                <Text
                  style={[styles.cancelText, { color: "#fff" }]}
                >
                  {i18n.t("addressForm_cancel") || "Cancel"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                accessibilityRole="button"
                accessibilityLabel={
                  isEditing
                    ? i18n.t("addressForm_save") || "Save"
                    : i18n.t("addressForm_add") || "Add address"
                }
               style={[styles.saveBtn, { backgroundColor: Colors.secondary }]}
               >
              
                <Text
                  style={[
                    styles.saveText,
                    { color: '#fff' },
                  ]}
                >
                  {isEditing
                    ? i18n.t("addressForm_save") || "Save changes"
                    : i18n.t("addressForm_add") || "Add address"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>

    {/* Rendered as a sibling — nested Modals on iOS sometimes paint with
        a transparent or invisible body, hiding the picker's labels. */}
    <LocationPicker
      visible={locationOpen}
      onClose={() => setLocationOpen(false)}
      onSelect={handleLocationSelect}
      initialValues={{
        countryId: form.countryId,
        cityId: form.cityId,
        subCityId: form.subCityId,
        countryName: form.countryName,
        cityName: form.cityName,
        subCityName: form.subCityName,
      }}
    />
    </>
  );
}

/* ---------------- Field shell ---------------- */

function Field({
  label,
  required,
  error,
  hint,
  focused,
  multiline,
  leading,
  writingDirection,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  focused?: boolean;
  multiline?: boolean;
  leading?: React.ReactNode;
  writingDirection: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  const t = useCheckoutTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <View
        style={[
          styles.fieldShell,
          multiline && styles.fieldShellMultiline,
          {
            backgroundColor: t.card,
            borderColor: error
              ? t.error
              : focused
                ? t.accent
                : t.border,
            borderWidth: focused || error ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        <View style={styles.fieldHeader}>
          {leading ? <View style={{ marginRight: 6 }}>{leading}</View> : null}
          <Text
            style={[styles.fieldLabel, { color: t.textTertiary }]}
            numberOfLines={1}
          >
            {label}
            {required ? (
              <Text style={{ color: t.error }}> *</Text>
            ) : null}
          </Text>
        </View>
        <View>{children}</View>
      </View>
      {error ? (
        <ErrorLine message={error} color={t.error} />
      ) : hint ? (
        <Text
          style={[styles.hintText, { color: t.textTertiary, writingDirection }]}
          numberOfLines={2}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function ErrorLine({ message, color }: { message: string; color: string }) {
  return (
    <View style={styles.errorRow}>
      <Ionicons name="alert-circle" size={13} color={color} />
      <Text style={[styles.errorText, { color }]} numberOfLines={2}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  kav: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    minHeight: 48,
  },
  headerTitle: { ...typography.title, flex: 1, textAlign: "center" },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },

  sectionLabel: {
    ...typography.label,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },

  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.button,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  chipText: { ...typography.captionStrong },

  fieldShell: {
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    paddingBottom: 6,
    minHeight: 52,
    justifyContent: "center",
  },
  fieldShellMultiline: {
    minHeight: 78,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 2,
    paddingHorizontal: 0,
    minHeight: 22,
  },
  inputMultiline: {
    minHeight: 52,
    textAlignVertical: "top",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  locationIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  locationText: { fontSize: 14, fontWeight: "500", lineHeight: 19, marginTop: 2 },
  locationPlaceholder: { fontSize: 14, fontWeight: "400", lineHeight: 19, marginTop: 2 },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
  toggleTitle: { ...typography.bodyStrong },
  toggleDesc: { ...typography.caption, marginTop: 2 },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: { ...typography.caption, flex: 1 },
  hintText: {
    ...typography.caption,
    marginTop: 6,
    marginLeft: 4,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    alignItems: "flex-start",
    justifyContent: "space-around",
 },
  cancelBtn: {
    flex: 0.3,
    height: 42,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    
  },
  cancelText: { ...typography.bodyStrong },
  saveBtn: {
    flex: 0.3,
    height: 42,
    borderRadius: radius.button,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { ...typography.subtitle },
});
