import { View, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Text } from '@/components/ui/text';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import type { LightColors, DarkColors } from '@/theme';

interface ProductHeaderProps {
  colors: LightColors | DarkColors;
}

export const ProductHeader = ({ colors }: ProductHeaderProps) => {
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface }, I18nManager.isRTL && styles.headerRTL]}>
      <Text style={[styles.brandName, { color: colors.text.gray }]}>Nubian</Text>
      <TouchableOpacity 
        style={styles.cartIconButton}
        onPress={() => router.push("/(tabs)/cart")}
        accessibilityLabel="Go to cart"
        accessibilityRole="button"
      >
        <Ionicons name="bag-outline" size={24} color={colors.text.gray} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 16,
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '600',
  },
  cartIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
