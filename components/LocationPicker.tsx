import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Text } from '@/components/ui/text';
import Ionicons from "@expo/vector-icons/Ionicons";
import i18n from '../utils/i18n';
import { useTheme } from '@/providers/ThemeProvider';
import useLocationStore from '@/store/locationStore';

export interface LocationData {
  countryId?: string;
  cityId?: string;
  subCityId?: string;
  countryName?: string;
  cityName?: string;
  subCityName?: string;
}

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialValues?: LocationData;
  language?: string; // 'ar' or 'en'
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  initialValues,
  language = 'ar'
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const {
    countries,
    citiesByCountryId,
    subCitiesByCityId,
    isLoading,
    loadCountries,
    loadCities,
    loadSubCities,
    getCitiesForCountry,
    getSubCitiesForCity
  } = useLocationStore();

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSubCity, setSelectedSubCity] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'country' | 'city' | 'subcity'>('country');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      loadCountries();
      setSelectedCountry(initialValues?.countryId || null);
      setSelectedCity(initialValues?.cityId || null);
      setSelectedSubCity(initialValues?.subCityId || null);
      setCurrentStep('country');
      setSearchQuery('');
    }
  }, [visible]); // Only depend on visible, not initialValues

  // Load cities when country changes (use ref to track if we've already loaded)
  useEffect(() => {
    if (selectedCountry && visible) {
      loadCities(selectedCountry);
    }
  }, [selectedCountry, visible]); // Remove loadCities from dependencies

  // Load subcities when city changes
  useEffect(() => {
    if (selectedCity && visible) {
      loadSubCities(selectedCity);
    }
  }, [selectedCity, visible]); // Remove loadSubCities from dependencies

  const handleCountrySelect = useCallback((countryId: string) => {
    setSelectedCountry(countryId);
    setSelectedCity(null);
    setSelectedSubCity(null);
    setCurrentStep('city');
    setSearchQuery('');
  }, []);

  const handleCitySelect = useCallback((cityId: string) => {
    setSelectedCity(cityId);
    setSelectedSubCity(null);
    setCurrentStep('subcity');
    setSearchQuery('');
  }, []);

  const handleSubCitySelect = useCallback((subCityId: string) => {
    const selectedCountryData = countries.find((c: any) => c._id === selectedCountry);
    const selectedCityData = citiesByCountryId[selectedCountry || '']?.find((c: any) => c._id === selectedCity);
    const selectedSubCityData = subCitiesByCityId[selectedCity || '']?.find((s: any) => s._id === subCityId);

    const locationData: LocationData = {
      countryId: selectedCountry || undefined,
      cityId: selectedCity || undefined,
      subCityId: subCityId,
      countryName: selectedCountryData ? (language === 'ar' ? selectedCountryData.nameAr : selectedCountryData.nameEn) : undefined,
      cityName: selectedCityData ? (language === 'ar' ? selectedCityData.nameAr : selectedCityData.nameEn) : undefined,
      subCityName: selectedSubCityData ? (language === 'ar' ? selectedSubCityData.nameAr : selectedSubCityData.nameEn) : undefined,
    };

    onSelect(locationData);
    onClose();
  }, [selectedCountry, selectedCity, countries, citiesByCountryId, subCitiesByCityId, language, onSelect, onClose]);

  const handleBack = useCallback(() => {
    if (currentStep === 'subcity') {
      setCurrentStep('city');
      setSelectedSubCity(null);
    } else if (currentStep === 'city') {
      setCurrentStep('country');
      setSelectedCity(null);
      setSelectedSubCity(null);
    }
    setSearchQuery('');
  }, [currentStep]);

  const getCurrentData = useCallback(() => {
    switch (currentStep) {
      case 'country':
        return countries.filter((item: any) =>
          searchQuery === '' ||
          (language === 'ar' ? item.nameAr : item.nameEn).toLowerCase().includes(searchQuery.toLowerCase())
        );
      case 'city':
        const cities = selectedCountry ? getCitiesForCountry(selectedCountry) : [];
        return cities.filter((item: any) =>
          searchQuery === '' ||
          (language === 'ar' ? item.nameAr : item.nameEn).toLowerCase().includes(searchQuery.toLowerCase())
        );
      case 'subcity':
        const subCities = selectedCity ? getSubCitiesForCity(selectedCity) : [];
        return subCities.filter((item: any) =>
          searchQuery === '' ||
          (language === 'ar' ? item.nameAr : item.nameEn).toLowerCase().includes(searchQuery.toLowerCase())
        );
      default:
        return [];
    }
  }, [currentStep, countries, selectedCountry, selectedCity, searchQuery, language, getCitiesForCountry, getSubCitiesForCity]);

  const getCurrentTitle = () => {
    switch (currentStep) {
      case 'country':
        return i18n.t('location_selectCountry');
      case 'city':
        return i18n.t('location_selectCity');
      case 'subcity':
        return i18n.t('location_selectSubCity');
      default:
        return '';
    }
  };

  const getCurrentPlaceholder = () => {
    switch (currentStep) {
      case 'country':
        return i18n.t('location_searchCountry');
      case 'city':
        return i18n.t('location_searchCity');
      case 'subcity':
        return i18n.t('location_searchSubCity');
      default:
        return '';
    }
  };

  const canGoBack = currentStep !== 'country';

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            {canGoBack && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <Text style={[styles.modalTitle, { color: colors.text.gray }]}>
              {getCurrentTitle()}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.veryLightGray} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.text.veryLightGray} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.gray }]}
              placeholder={getCurrentPlaceholder()}
              placeholderTextColor={colors.text.veryLightGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text.veryLightGray }]}>
                {i18n.t('loading')}
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
              {getCurrentData().map((item: any) => (
                <TouchableOpacity
                  key={item._id}
                  style={[styles.item, { borderBottomColor: colors.borderLight }]}
                  onPress={() => {
                    if (currentStep === 'country') handleCountrySelect(item._id);
                    else if (currentStep === 'city') handleCitySelect(item._id);
                    else if (currentStep === 'subcity') handleSubCitySelect(item._id);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemContent}>
                    <Ionicons name="location-outline" size={20} color={colors.primary} />
                    <View style={styles.itemText}>
                      <Text style={[styles.itemTitle, { color: colors.text.gray }]}>
                        {language === 'ar' ? item.nameAr : item.nameEn}
                      </Text>
                      <Text style={[styles.itemSubtitle, { color: colors.text.veryLightGray }]}>
                        {language === 'ar' ? item.nameEn : item.nameAr}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.veryLightGray} />
                </TouchableOpacity>
              ))}

              {getCurrentData().length === 0 && !isLoading && (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={48} color={colors.text.veryLightGray} />
                  <Text style={[styles.emptyText, { color: colors.text.veryLightGray }]}>
                    {searchQuery ? i18n.t('location_noResults') : i18n.t('location_noData')}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default LocationPicker;