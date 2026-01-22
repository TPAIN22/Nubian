import { View, StyleSheet, TouchableOpacity, I18nManager, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LightColors, DarkColors } from '@/theme';

interface ProductHeaderProps {
  colors: LightColors | DarkColors;
}

export const ProductHeader = ({ colors }: ProductHeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View 
      style={[
        styles.header, 
        { 
          backgroundColor: colors.surface,
          paddingTop: insets.top + 16,
        },
        I18nManager.isRTL && styles.headerRTL
      ]}
    >
      <View style={styles.brandContainer}>
        <Text 
          style={[
            styles.brandName,
            { 
              color: colors.text.gray,
              textAlign: I18nManager.isRTL ? "right" : "left",
            }
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit={false}
        >
          Nubian
        </Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.cartIconButton,
          { backgroundColor: colors.surface }
        ]}
        onPress={() => router.push("/(tabs)/cart")}
        accessibilityLabel="Go to cart"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Ionicons 
          name="bag-outline" 
          size={24} 
          color={colors.text.gray} 
        />
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
    paddingBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRTL: {
    flexDirection: 'row-reverse',
  },
  brandContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 12,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 32,
    textAlign: I18nManager.isRTL ? "right" : "left",
  },
  cartIconButton: {
    width: 32,
    height: 32,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
});