import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/locales/brandColors';

interface PriceDisplayProps {
    priceUSD: number;
    priceDisplay?: string;
    rateUnavailable?: boolean;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    showUSD?: boolean;
}

export default function PriceDisplay({
    priceUSD,
    priceDisplay,
    rateUnavailable,
    size = 'md',
    color = Colors.primary,
    showUSD = false,
}: PriceDisplayProps) {
    const fontSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;

    const { formatPrice } = require('@/utils/priceUtils');

    return (
        <View style={styles.container}>
            {priceDisplay ? (
                <View>
                    <Text style={[styles.mainPrice, { fontSize, color }]}>
                        {priceDisplay}
                    </Text>
                    {rateUnavailable && (
                        <Text style={styles.warningText}>
                            (Rate unavailable - showing approximate conversion)
                        </Text>
                    )}
                </View>
            ) : (
                <Text style={[styles.mainPrice, { fontSize, color }]}>
                    {formatPrice(priceUSD)}
                </Text>
            )}

            {showUSD && priceDisplay && (
                <Text style={styles.usdEquivalent}>
                    ({formatPrice(priceUSD)})
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    mainPrice: {
        fontWeight: '700',
    },
    warningText: {
        fontSize: 10,
        color: Colors.error,
        marginTop: 2,
    },
    usdEquivalent: {
        fontSize: 12,
        color: Colors.text.veryLightGray,
        marginLeft: 4,
    },
});
