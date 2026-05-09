import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import i18n from "@/utils/i18n";
import useLocationStore from "@/store/locationStore";
import {
  radius,
  spacing,
  typography,
  useCheckoutTheme,
} from "@/components/checkout";

export interface LocationData {
  countryId?: string;
  cityId?: string;
  subCityId?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;
}

/**
 * Backend returns `nameEn` / `nameAr` (see apps/backend/src/models/country.model.js
 * and friends). Pick whichever matches the active language, falling back across
 * locales and the legacy `name` field so older cached records keep rendering.
 */
const localizedName = (item: any): string => {
  if (!item) return "";
  const isAr = i18n.language === "ar";
  if (isAr) return item.nameAr || item.nameEn || item.name || "";
  return item.nameEn || item.nameAr || item.name || "";
};

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialValues?: LocationData;
}

type Step = "country" | "city" | "subcity";

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  initialValues,
}) => {
  const t = useCheckoutTheme();
  const insets = useSafeAreaInsets();
  const writingDirection: "ltr" | "rtl" =
    i18n.language === "ar" ? "rtl" : "ltr";

  const {
    countries,
    citiesByCountryId,
    subCitiesByCityId,
    isLoading,
    loadCountries,
    loadCities,
    loadSubCities,
    getCitiesForCountry,
    getSubCitiesForCity,
  } = useLocationStore();

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [, setSelectedSubCity] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("country");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!visible) return;
    loadCountries();
    setSelectedCountry(initialValues?.countryId || null);
    setSelectedCity(initialValues?.cityId || null);
    setSelectedSubCity(initialValues?.subCityId || null);
    setStep("country");
    setSearch("");
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedCountry && visible) loadCities(selectedCountry);
  }, [selectedCountry, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedCity && visible) loadSubCities(selectedCity);
  }, [selectedCity, visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPickCountry = useCallback((id: string) => {
    setSelectedCountry(id);
    setSelectedCity(null);
    setSelectedSubCity(null);
    setStep("city");
    setSearch("");
  }, []);

  const onPickCity = useCallback((id: string) => {
    setSelectedCity(id);
    setSelectedSubCity(null);
    setStep("subcity");
    setSearch("");
  }, []);

  const onPickSubCity = useCallback(
    (id: string) => {
      const country = countries.find((c: any) => c._id === selectedCountry);
      const city = citiesByCountryId[selectedCountry || ""]?.find(
        (c: any) => c._id === selectedCity,
      );
      const sub = subCitiesByCityId[selectedCity || ""]?.find(
        (s: any) => s._id === id,
      );

      onSelect({
        countryId: selectedCountry || undefined,
        cityId: selectedCity || undefined,
        subCityId: id,
        countryName: localizedName(country),
        cityName: localizedName(city),
        subCityName: localizedName(sub),
      });
      onClose();
    },
    [
      countries,
      selectedCountry,
      selectedCity,
      citiesByCountryId,
      subCitiesByCityId,
      onSelect,
      onClose,
    ],
  );

  const onBack = useCallback(() => {
    if (step === "subcity") {
      setStep("city");
      setSelectedSubCity(null);
    } else if (step === "city") {
      setStep("country");
      setSelectedCity(null);
      setSelectedSubCity(null);
    }
    setSearch("");
  }, [step]);

  const data = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Match against the localized name as well as the alternate locale and
    // any legacy `name`, so users searching in either language still find rows.
    const matches = (item: any) => {
      if (!q) return true;
      return [item.nameEn, item.nameAr, item.name, localizedName(item)]
        .some(v => String(v ?? "").toLowerCase().includes(q));
    };

    if (step === "country") return countries.filter(matches);
    if (step === "city") {
      return selectedCountry ? getCitiesForCountry(selectedCountry).filter(matches) : [];
    }
    return selectedCity ? getSubCitiesForCity(selectedCity).filter(matches) : [];
  }, [
    step,
    countries,
    selectedCountry,
    selectedCity,
    search,
    getCitiesForCountry,
    getSubCitiesForCity,
  ]);

  const title =
    step === "country"
      ? i18n.t("location_selectCountry") || "Select country"
      : step === "city"
        ? i18n.t("location_selectCity") || "Select city"
        : i18n.t("location_selectSubCity") || "Select area";

  const placeholder =
    step === "country"
      ? i18n.t("location_searchCountry") || "Search country"
      : step === "city"
        ? i18n.t("location_searchCity") || "Search city"
        : i18n.t("location_searchSubCity") || "Search area";

  const stepIcon: React.ComponentProps<typeof Ionicons>["name"] =
    step === "country"
      ? "earth-outline"
      : step === "city"
        ? "business-outline"
        : "navigate-outline";

  // Breadcrumb pieces
  const country = countries.find((c: any) => c._id === selectedCountry);
  const city = citiesByCountryId[selectedCountry || ""]?.find(
    (c: any) => c._id === selectedCity,
  );

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => {
        if (step === "country") onPickCountry(item._id);
        else if (step === "city") onPickCity(item._id);
        else onPickSubCity(item._id);
      }}
      accessibilityRole="button"
      accessibilityLabel={localizedName(item)}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: pressed ? t.surfaceMuted : "transparent",
          borderBottomColor: t.divider,
        },
      ]}
    >
      <View
        style={[styles.itemIcon, { backgroundColor: t.accentSoft }]}
      >
        <Ionicons name={stepIcon} size={16} color={t.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.itemTitle, { color: t.textPrimary, writingDirection }]}
          numberOfLines={1}
        >
          {localizedName(item)}
        </Text>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"}
        size={16}
        color={t.textTertiary}
      />
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: t.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: t.surface,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            {/* Drag handle */}
            <View style={styles.handleWrap}>
              <View
                style={[styles.handle, { backgroundColor: t.borderStrong }]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={step === "country" ? onClose : onBack}
                accessibilityRole="button"
                accessibilityLabel={
                  step === "country"
                    ? i18n.t("close") || "Close"
                    : i18n.t("back") || "Back"
                }
                hitSlop={12}
                style={({ pressed }) => [
                  styles.headerBtn,
                  { backgroundColor: t.surfaceMuted },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons
                  name={
                    step === "country"
                      ? "close"
                      : I18nManager.isRTL
                        ? "chevron-forward"
                        : "chevron-back"
                  }
                  size={18}
                  color={t.textPrimary}
                />
              </Pressable>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text
                  style={[styles.title, { color: t.textPrimary }]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                <Text
                  style={[styles.stepIndicator, { color: t.textTertiary }]}
                >
                  {step === "country"
                    ? `1 / 3`
                    : step === "city"
                      ? `2 / 3`
                      : `3 / 3`}
                </Text>
              </View>
              <View style={styles.headerBtn} />
            </View>

            {/* Breadcrumb */}
            {step !== "country" ? (
              <View style={styles.crumbWrap}>
                <View
                  style={[
                    styles.crumb,
                    { backgroundColor: t.surfaceMuted, borderColor: t.border },
                  ]}
                >
                  <Ionicons name="earth-outline" size={12} color={t.accent} />
                  <Text
                    style={[styles.crumbText, { color: t.textPrimary }]}
                    numberOfLines={1}
                  >
                    {localizedName(country) || "—"}
                  </Text>
                </View>
                {step === "subcity" ? (
                  <>
                    <Ionicons
                      name={
                        I18nManager.isRTL ? "chevron-back" : "chevron-forward"
                      }
                      size={12}
                      color={t.textTertiary}
                    />
                    <View
                      style={[
                        styles.crumb,
                        {
                          backgroundColor: t.surfaceMuted,
                          borderColor: t.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="business-outline"
                        size={12}
                        color={t.accent}
                      />
                      <Text
                        style={[styles.crumbText, { color: t.textPrimary }]}
                        numberOfLines={1}
                      >
                        {localizedName(city) || "—"}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}

            {/* Search */}
            <View
              style={[
                styles.search,
                {
                  backgroundColor: t.surfaceMuted,
                  borderColor: t.border,
                  flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
                },
              ]}
            >
              <Ionicons
                name="search"
                size={16}
                color={t.textTertiary}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={placeholder}
                placeholderTextColor={t.textTertiary}
                style={[
                  styles.searchInput,
                  {
                    color: t.textPrimary,
                    textAlign: I18nManager.isRTL ? "right" : "left",
                  },
                ]}
                autoCorrect={false}
                returnKeyType="search"
              />
              {search ? (
                <Pressable
                  onPress={() => setSearch("")}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t("clear") || "Clear"}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={t.textTertiary}
                  />
                </Pressable>
              ) : null}
            </View>

            {/* List */}
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={t.accent} />
                <Text
                  style={[styles.loadingText, { color: t.textTertiary }]}
                >
                  {i18n.t("loading") || "Loading…"}
                </Text>
              </View>
            ) : data.length === 0 ? (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: t.surfaceMuted },
                  ]}
                >
                  <Ionicons
                    name="search-outline"
                    size={26}
                    color={t.textTertiary}
                  />
                </View>
                <Text
                  style={[styles.emptyText, { color: t.textPrimary }]}
                >
                  {search
                    ? i18n.t("location_noResults") || "No matches"
                    : i18n.t("location_noData") || "Nothing here yet"}
                </Text>
                {search ? (
                  <Text
                    style={[styles.emptyHint, { color: t.textTertiary }]}
                  >
                    {i18n.t("location_noResultsHint") ||
                      "Try a different spelling or shorter query."}
                  </Text>
                ) : null}
              </View>
            ) : (
              <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item: any) => String(item._id)}
                style={styles.list}
                contentContainerStyle={{ paddingBottom: spacing.md }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  kav: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "85%",
    minHeight: "55%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 48,
    gap: spacing.sm,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { ...typography.subtitle, fontSize: 16 },
  stepIndicator: { ...typography.label, marginTop: 2, letterSpacing: 0.6 },

  crumbWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  crumb: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    flexShrink: 1,
  },
  crumbText: { ...typography.caption, fontWeight: "600" },

  search: {
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.input,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: "500", padding: 0 },

  list: { flex: 1 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: { ...typography.body, fontSize: 15, fontWeight: "500" },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: { ...typography.caption },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  emptyText: { ...typography.bodyStrong, textAlign: "center" },
  emptyHint: { ...typography.caption, textAlign: "center", maxWidth: 240 },
});

export default LocationPicker;
