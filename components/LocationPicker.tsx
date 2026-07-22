import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from "@/utils/i18n";
import { spacing, useCheckoutTheme } from "@/components/checkout";
import {
  LocationBreadcrumb,
  LocationEmptyState,
  LocationErrorState,
  LocationListItem,
  LocationListSkeleton,
  LocationPickerHeader,
  LocationSearchBar,
  localizedName,
  useLocationPicker,
  type LocationData,
  type LocationItem,
  type LocationStep,
} from "@/components/location";

// Re-export so existing consumers (`import { LocationData } from
// "@/components/LocationPicker"`) keep compiling unchanged.
export type { LocationData };

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialValues?: LocationData;
}

const STEP_ICON: Record<LocationStep, React.ComponentProps<typeof Ionicons>["name"]> = {
  country: "earth-outline",
  city: "business-outline",
  subcity: "navigate-outline",
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  initialValues,
}) => {
  const t = useCheckoutTheme();
  const insets = useSafeAreaInsets();
  const isRTL = I18nManager.isRTL;

  const {
    step,
    stepIndex,
    search,
    setSearch,
    data,
    activeId,
    selectedCountry,
    selectedCity,
    isLoading,
    error,
    onPick,
    onBack,
    canGoBack,
    retry,
  } = useLocationPicker({ visible, initialValues, onSelect, onClose });

  const title = useMemo(() => {
    if (step === "country") return i18n.t("location_selectCountry") || "Select country";
    if (step === "city") return i18n.t("location_selectCity") || "Select city";
    return i18n.t("location_selectSubCity") || "Select area";
  }, [step]);

  const placeholder = useMemo(() => {
    if (step === "country") return i18n.t("location_searchCountry") || "Search country";
    if (step === "city") return i18n.t("location_searchCity") || "Search city";
    return i18n.t("location_searchSubCity") || "Search area";
  }, [step]);

  const crumbs = useMemo(() => {
    const list: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }[] = [];
    if (step !== "country" && selectedCountry) {
      list.push({ icon: "earth-outline", label: localizedName(selectedCountry) });
    }
    if (step === "subcity" && selectedCity) {
      list.push({ icon: "business-outline", label: localizedName(selectedCity) });
    }
    return list;
  }, [step, selectedCountry, selectedCity]);

  const listIcon = STEP_ICON[step];

  const renderItem = useCallback(
    ({ item }: { item: LocationItem }) => (
      <LocationListItem
        id={item._id}
        label={localizedName(item)}
        icon={listIcon}
        selected={String(activeId) === String(item._id)}
        isRTL={isRTL}
        onPress={onPick}
      />
    ),
    [activeId, isRTL, listIcon, onPick],
  );

  const keyExtractor = useCallback((item: LocationItem) => String(item._id), []);

  const showSkeleton = isLoading && data.length === 0;
  const showError = !!error && !isLoading && data.length === 0;
  const showEmpty = !isLoading && !error && data.length === 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.backdrop, { backgroundColor: t.overlay }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("close") || "Close"}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
          pointerEvents="box-none"
        >
          <Animated.View
            entering={FadeInDown.springify().damping(20).mass(0.7)}
            style={[
              styles.sheet,
              {
                backgroundColor: t.surface,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            {/* Grabber */}
            <View style={styles.handleWrap}>
              <View style={[styles.handle, { backgroundColor: t.borderStrong }]} />
            </View>

            <LocationPickerHeader
              title={title}
              stepIndex={stepIndex}
              canGoBack={canGoBack}
              onBack={onBack}
              onClose={onClose}
            />

            <LocationBreadcrumb crumbs={crumbs} />

            <LocationSearchBar
              value={search}
              onChange={setSearch}
              placeholder={placeholder}
            />

            {showSkeleton ? (
              <LocationListSkeleton />
            ) : showError ? (
              <LocationErrorState message={error} onRetry={retry} />
            ) : showEmpty ? (
              <LocationEmptyState searching={!!search.trim()} />
            ) : (
              <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                initialNumToRender={12}
                windowSize={11}
                removeClippedSubviews={Platform.OS === "android"}
              />
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  kav: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    maxHeight: "88%",
    minHeight: "58%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
});

export default LocationPicker;
