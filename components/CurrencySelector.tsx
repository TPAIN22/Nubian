import { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useCurrencyStore, useHasSelectedCurrency } from '@/store/useCurrencyStore';
import { useUser } from '@clerk/clerk-expo';
import { LinearGradient } from 'expo-linear-gradient';
import { toast } from 'sonner-native';

import { Ionicons } from '@expo/vector-icons';
import Colors from '@/locales/brandColors';

interface CurrencySelectorProps {
    visible?: boolean;
    mandatory?: boolean; // If true, cannot be dismissed without selection
    onComplete?: () => void;
}

export default function CurrencySelector({ visible, mandatory = false, onComplete }: CurrencySelectorProps) {
    const { user } = useUser();
    const {
        countries,
        currencies,
        countryCode,
        currencyCode,
        isLoading,
        fetchMetadata,
        savePreferences,
    } = useCurrencyStore();

    const hasSelection = useHasSelectedCurrency();

    // Local selection state (before save)
    const [selectedCountry, setSelectedCountry] = useState<string | null>(countryCode);
    const [selectedCurrency, setSelectedCurrency] = useState<string | null>(currencyCode);
    const [step, setStep] = useState<'country' | 'currency'>('country');

    // Show modal if mandatory and no selection, or if explicitly visible
    const shouldShow = visible || (mandatory && !hasSelection);

    useEffect(() => {
        if (shouldShow && countries.length === 0) {
            fetchMetadata();
        }
    }, [shouldShow, countries.length, fetchMetadata]);

    useEffect(() => {
        setSelectedCountry(countryCode);
        setSelectedCurrency(currencyCode);
    }, [countryCode, currencyCode]);

    const handleCountrySelect = useCallback((code: string) => {
        setSelectedCountry(code);
        const country = countries.find(c => c.code === code);
        if (country?.defaultCurrencyCode) {
            setSelectedCurrency(country.defaultCurrencyCode);
        }
        setStep('currency');
    }, [countries]);

    const handleCurrencySelect = useCallback((code: string) => {
        setSelectedCurrency(code);
    }, []);

    const handleComplete = useCallback(async () => {
        if (selectedCountry && selectedCurrency) {
            await savePreferences(selectedCountry, selectedCurrency, user?.id);
            toast.success('Currency preference updated');
            onComplete?.();
        }
    }, [selectedCountry, selectedCurrency, savePreferences, onComplete, user?.id]);

    const handleBack = useCallback(() => {
        setStep('country');
    }, []);

    if (!shouldShow) return null;

    return (
        <Modal
            visible={shouldShow}
            animationType="slide"
            transparent={false}
            onRequestClose={mandatory ? undefined : onComplete}
        >
            <SafeAreaView style={styles.container}>
                <LinearGradient
                    colors={[Colors.secondaryBackground, Colors.darkBackground, Colors.secondaryBackground]}
                    style={styles.gradient}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        {step === 'currency' && (
                            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={Colors.text.white} />
                            </TouchableOpacity>
                        )}
                        <View style={styles.headerCenter}>
                            <Ionicons
                                name={step === 'country' ? 'globe-outline' : 'cash-outline'}
                                size={40}
                                color={Colors.primary}
                            />
                            <Text style={styles.title}>
                                {step === 'country' ? 'اختر دولتك' : 'اختر العملة'}
                            </Text>
                            <Text style={styles.subtitle}>
                                {step === 'country'
                                    ? 'Select your country to see local prices'
                                    : 'Choose your preferred currency'}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loadingText}>جاري التحميل...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={(step === 'country' ? countries : currencies) as any[]}
                            keyExtractor={(item) => item.code}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => {
                                const isSelected = step === 'country'
                                    ? selectedCountry === item.code
                                    : selectedCurrency === item.code;

                                return (
                                    <TouchableOpacity
                                        style={[styles.item, isSelected && styles.itemSelected]}
                                        onPress={() => step === 'country'
                                            ? handleCountrySelect(item.code)
                                            : handleCurrencySelect(item.code)
                                        }
                                    >
                                        <View style={styles.itemContent}>
                                            {step === 'currency' && 'symbol' in item && (
                                                <Text style={styles.currencySymbol}>{item.symbol as string}</Text>
                                            )}
                                            <View style={styles.itemText}>
                                                <Text style={styles.itemTitle}>
                                                    {step === 'country'
                                                        ? (item as any).nameEn
                                                        : (item as any).name}
                                                </Text>
                                                <Text style={styles.itemSubtitle}>
                                                    {step === 'country'
                                                        ? (item as any).nameAr
                                                        : (item as any).nameAr || item.code}
                                                </Text>
                                            </View>
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    )}

                    {/* Continue button (step 2 only) */}
                    {step === 'currency' && selectedCurrency && (
                        <TouchableOpacity style={[styles.continueButton, { backgroundColor: Colors.primary }]} onPress={handleComplete}>
                            <Text style={styles.continueButtonText}>متابعة</Text>
                            <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
                        </TouchableOpacity>
                    )}
                </LinearGradient>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
    },
    headerCenter: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 15,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 8,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#aaa',
        marginTop: 15,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    itemSelected: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(163, 126, 44, 0.15)', // Colors.primary with opacity
    },
    itemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    currencySymbol: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginRight: 12,
        minWidth: 40,
        textAlign: 'center',
    },
    itemText: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    continueButton: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
